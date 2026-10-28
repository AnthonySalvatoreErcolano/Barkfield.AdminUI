// Fake NotificationsPort. Behaves like the API (NotificationAdminService, NotificationService,
// NotificationRule.cs, NotificationOutboxEntry.cs), with its wording — including where it is awkward:
//   - a new rule is born disabled and in dry run, whatever is sent
//   - an event rule needs a target status; a scheduled one needs offsetDays; from cannot equal to
//   - System-tier templates can't be created or driven by a rule; built-in ones can't be deleted, nor
//     can one a rule still uses
//   - the transport only logs (transportIsReal false), so "Sent" means "would have been"
//   - an unresolved placeholder is left visible in the rendered text, and listed
//   - retry refuses an entry already sent; anything else goes back in the queue
//   - the reminder sweep claims the day: a second run that day is `alreadyRanToday` unless forced
// The outbox is seeded with one entry in every status, including a substitution notice held for
// review because Greg Olsen's dog Duke has a recorded allergy.
import { NotificationAudience, NotificationStatus, NotificationTier, NotificationTriggerKind, SuppressionReason } from '../generated/enums';
import { NotFoundError, ValidationError, ConflictError } from '../errors';
import type {
  DeliveryDetail, NotificationPreview, NotificationRule, NotificationSettings, NotificationSuppression,
  NotificationTemplate, NotificationTrigger, NotificationsPort, OutboxEntry,
} from '../ports';
import { formatDay, formatMoney } from '../../lib/format';
import type { Seed } from './seed';

const SHOP = 'Barkfield Road';
const COMMON = ['CustomerFirstName', 'CustomerLastName', 'CustomerFullName', 'DeliveryDate', 'DeliveredAt', 'ItemCount', 'OrderTotal', 'DeliveryCity', 'ReceiptUrl', 'ShopName'];

/** The live catalogue as the API returns it (2026-10-28), so the fake can't drift into its own list. */
const TRIGGERS: NotificationTrigger[] = [
  {
    kind: NotificationTriggerKind.DeliveryStatus, kindName: 'DeliveryStatus', isEventTrigger: true,
    description: 'A delivery moves through the workflow — packed, routed, out for delivery, arrived.',
    statuses: ['Scheduled', 'Packed', 'Routed', 'OutForDelivery', 'Delivered', 'Failed', 'Canceled'].map((name, i) => ({ value: i + 1, name })),
    placeholders: COMMON,
  },
  {
    kind: NotificationTriggerKind.LineOrderStatus, kindName: 'LineOrderStatus', isEventTrigger: true,
    description: 'One product on a delivery moves — ordered, received, out of stock, substituted. A substitution notice to a household with an allergic pet is held for review rather than sent, because the system cannot tell whether the replacement is safe.',
    statuses: ['Pending', 'Ordered', 'PartiallyReceived', 'Received', 'OutOfStock', 'Substituted', 'Shorted'].map((name, i) => ({ value: i + 1, name })),
    placeholders: [...COMMON, 'ProductName', 'Quantity', 'SubstitutedWithProductName'],
  },
  {
    kind: NotificationTriggerKind.PaymentStatus, kindName: 'PaymentStatus', isEventTrigger: true,
    description: 'A card on file is charged or refused. Square sends nothing of its own for a card-on-file charge, so without a rule here the customer is not told.',
    statuses: ['NotCharged', 'Paid', 'Failed'].map((name, i) => ({ value: i + 1, name })),
    // ReceiptUrl appears twice here, exactly as the API sends it.
    placeholders: [...COMMON, 'AmountCharged', 'ReceiptUrl', 'PaymentFailureReason'],
  },
  {
    kind: NotificationTriggerKind.BeforeNextDelivery, kindName: 'BeforeNextDelivery', isEventTrigger: false,
    description: 'A fixed number of days before a subscription\'s next delivery. Unlike the others this is not a transition, so a daily sweep asks the question — which means it needs offsetDays rather than a status.',
    statuses: [], placeholders: ['CustomerFirstName', 'CustomerLastName', 'CustomerFullName', 'NextDeliveryDate', 'DeliveryDate', 'SubscriptionName', 'ShopName'],
  },
];

const SUBJECT_NOUN: Partial<Record<number, string>> = {
  [NotificationTriggerKind.DeliveryStatus]: 'delivery',
  [NotificationTriggerKind.LineOrderStatus]: 'product on a delivery',
  [NotificationTriggerKind.ProcurementStatus]: 'delivery\'s stock',
  [NotificationTriggerKind.PaymentStatus]: 'payment',
  [NotificationTriggerKind.SubscriptionStatus]: 'subscription',
  [NotificationTriggerKind.DispatchEvent]: 'dispatch',
};

const NAMES = { trigger: ['', 'DeliveryStatus', 'LineOrderStatus', 'ProcurementStatus', 'PaymentStatus', 'SubscriptionStatus', 'DispatchEvent'] as string[], audience: ['', 'Customer', 'Internal'], tier: ['', 'System', 'Operational', 'Marketing'], status: ['', 'Queued', 'Sent', 'Failed', 'Suppressed', 'Skipped', 'HeldForReview'], suppression: ['', 'Unsubscribed', 'HardBounce', 'Complaint', 'Manual'] };
const triggerName = (k: number) => (k === 20 ? 'BeforeNextDelivery' : k === 21 ? 'CardExpiring' : k === 22 ? 'Dormant' : NAMES.trigger[k] ?? String(k));

interface RuleState { id: string; name: string; templateId: string; triggerKind: number; audience: number; fromStatus: number | null; toStatus: number | null; offsetDays: number | null; isEnabled: boolean; isDryRun: boolean; createdAt: string; updatedAt: string | null; revision: number }
interface TemplateState { id: string; name: string; tier: number; subject: string; bodyText: string; isSystem: boolean; createdAt: string; updatedAt: string | null; revision: number }
interface EntryState { id: string; ruleId: string | null; customerId: string | null; deliveryId: string | null; dedupKey: string | null; toEmail: string; toName: string; subject: string; bodyText: string; status: number; attempts: number; lastError: string | null; queuedAt: string; sendAfter: string; sentAt: string | null }

const now = () => new Date().toISOString();
const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();
const todayDate = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

function systemTemplates(): TemplateState[] {
  const t = (n: number, name: string, subject: string, bodyText: string): TemplateState => ({
    id: `7e0a0000-0000-4000-8000-00000000000${n}`, name, tier: NotificationTier.Operational, subject, bodyText, isSystem: true,
    createdAt: hoursAgo(72), updatedAt: null, revision: 0,
  });
  return [
    t(1, 'Delivery confirmation', 'Your Barkfield Road delivery has arrived', 'Hello {{CustomerFirstName}},\n\nYour order was delivered on {{DeliveredAt}}.\n\nThank you,\nBarkfield Road'),
    t(2, 'Delivery reminder', 'Your Barkfield Road delivery is coming up', 'Hello {{CustomerFirstName}},\n\nJust a reminder that your next delivery is due on {{NextDeliveryDate}}.\n\nIf you need to change anything, reply to this email or call the shop.\n\nBarkfield Road'),
    t(3, 'Product substituted', 'A change to your Barkfield Road order', 'Hello {{CustomerFirstName}},\n\nWe were out of {{ProductName}} for your delivery on {{DeliveryDate}}, so we have sent {{SubstitutedWithProductName}} instead.\n\nIf that does not suit, reply to this email and we will put it right.\n\nBarkfield Road'),
    t(4, 'Item out of stock', 'One item is unavailable for your next delivery', 'Hello {{CustomerFirstName}},\n\n{{ProductName}} is unavailable for your delivery on {{DeliveryDate}}. We will be in touch about what to send instead.\n\nBarkfield Road'),
    t(5, 'Payment taken', 'Your Barkfield Road payment', 'Hello {{CustomerFirstName}},\n\nWe have charged {{AmountCharged}} to the card on file for your delivery on {{DeliveryDate}}.\n\nYour receipt: {{ReceiptUrl}}\n\nBarkfield Road'),
    t(6, 'Card was refused', 'We could not take payment for your next delivery', 'Hello {{CustomerFirstName}},\n\nThe card on file was refused for your delivery on {{DeliveryDate}}, so it is on hold.\n\nReply to this email or call the shop and we will sort it out.\n\nBarkfield Road'),
    t(7, 'Staff: a card was refused', '[Barkfield] A card was refused', "{{CustomerFullName}}'s card was refused for the delivery on {{DeliveryDate}}.\n\nReason given: {{PaymentFailureReason}}\n\nSomebody needs to ring them."),
    t(8, 'Staff: stock is blocking a delivery', '[Barkfield] A delivery is blocked on stock', "{{ProductName}} is out of stock for {{CustomerFullName}}'s delivery on {{DeliveryDate}}.\n\nIt needs a substitution or a decision before it can be packed."),
  ];
}

export function createFakeNotifications(
  db: Seed,
  wait: () => Promise<void>,
  currentUser: () => { email: string; name: string } | null,
  options: { autoDrain?: boolean } = {},
): NotificationsPort {
  const templates = systemTemplates();
  const tid = (name: string) => templates.find(t => t.name === name)!.id;
  const rule = (n: number, r: Omit<RuleState, 'id' | 'createdAt' | 'updatedAt' | 'revision'>): RuleState => ({ id: `7e0b0000-0000-4000-8000-00000000000${n}`, createdAt: hoursAgo(48), updatedAt: null, revision: 0, ...r });
  const rules: RuleState[] = [
    // Mirrors the dev database: already live.
    rule(1, { name: 'Tell the customer when a delivery arrives', templateId: tid('Delivery confirmation'), triggerKind: NotificationTriggerKind.DeliveryStatus, audience: NotificationAudience.Customer, fromStatus: null, toStatus: 5, offsetDays: null, isEnabled: true, isDryRun: false }),
    rule(2, { name: 'Remind customers 3 days ahead', templateId: tid('Delivery reminder'), triggerKind: NotificationTriggerKind.BeforeNextDelivery, audience: NotificationAudience.Customer, fromStatus: null, toStatus: null, offsetDays: 3, isEnabled: true, isDryRun: true }),
    rule(3, { name: 'Tell the customer about a substitution', templateId: tid('Product substituted'), triggerKind: NotificationTriggerKind.LineOrderStatus, audience: NotificationAudience.Customer, fromStatus: null, toStatus: 6, offsetDays: null, isEnabled: true, isDryRun: false }),
    rule(4, { name: 'Tell the shop when a card is refused', templateId: tid('Staff: a card was refused'), triggerKind: NotificationTriggerKind.PaymentStatus, audience: NotificationAudience.Internal, fromStatus: null, toStatus: 3, offsetDays: null, isEnabled: false, isDryRun: true }),
  ];
  const settings: NotificationSettings = {
    isSendingEnabled: true, quietHoursStartLocal: null, quietHoursEndLocal: null, maxPerCustomerPerDay: 5, hasQuietHours: false,
    internalRecipientEmail: null, canSendInternal: false, lastSweepDate: null, updatedAt: null,
    transportDescription: 'Logging only — nothing is sent. Configure a real email provider before go-live.', transportIsReal: false,
  };
  const suppressions: NotificationSuppression[] = [
    { id: '7e0c0000-0000-4000-8000-000000000001', email: 'old.address@example.com', reason: SuppressionReason.HardBounce, reasonName: 'HardBounce', note: 'Mailbox no longer exists.', createdAt: hoursAgo(200) },
  ];

  // --- Rendering, as NotificationService.BuildPlaceholders fills it -----------------------------
  const valuesFor = (d: DeliveryDetail | undefined, subName?: string | null, nextDate?: string | null): Record<string, string | null> => {
    const c = d ? db.customers.find(x => x.id === d.customerId) : undefined;
    const line = d?.lines[0];
    return {
      CustomerFirstName: c?.firstName ?? null, CustomerLastName: c?.lastName ?? null, CustomerFullName: c ? `${c.firstName} ${c.lastName}` : null,
      DeliveryDate: d ? formatDay(d.scheduledFor, 'long') : nextDate ? formatDay(nextDate, 'long') : null,
      DeliveredAt: d?.completedAt ? formatDay(d.completedAt, 'long') : null,
      ItemCount: d ? String(d.lines.reduce((n, l) => n + l.quantity, 0)) : null,
      OrderTotal: d ? formatMoney(d.total) : null, DeliveryCity: d?.deliveryCity ?? null, ReceiptUrl: d?.squareReceiptUrl ?? null,
      ShopName: SHOP, ProductName: line?.productName ?? null, Quantity: line ? String(line.quantity) : null,
      SubstitutedWithProductName: line?.substitutedWithProductName ?? null,
      AmountCharged: d?.amountCharged != null ? formatMoney(d.amountCharged) : null, PaymentFailureReason: d?.paymentFailureReason ?? null,
      NextDeliveryDate: nextDate ? formatDay(nextDate, 'long') : null, SubscriptionName: subName ?? d?.subscriptionDisplayName ?? null,
    };
  };
  // Unknown or empty placeholders are left in place, on purpose, so a typo is visible.
  const render = (text: string, values: Record<string, string | null>) => text.replace(/\{\{\s*(\w+)\s*\}\}/g, (all, key: string) => values[key] ?? all);
  const unresolved = (...texts: string[]) => [...new Set(texts.flatMap(t => [...t.matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map(m => m[1]!)))];

  // --- The outbox, one entry per status -------------------------------------------------------------
  const outbox: EntryState[] = [];
  const queue = (e: Partial<EntryState> & Pick<EntryState, 'toEmail' | 'toName' | 'subject' | 'bodyText' | 'status'>): EntryState => {
    const entry: EntryState = {
      id: crypto.randomUUID(), ruleId: null, customerId: null, deliveryId: null, dedupKey: null, attempts: 0, lastError: null,
      queuedAt: now(), sendAfter: now(), sentAt: null, ...e,
    };
    entry.toEmail = entry.toEmail.trim().toLowerCase();
    outbox.push(entry);
    return entry;
  };
  const seedEntry = (customerName: string, ruleIdx: number, status: number, extra: Partial<EntryState> = {}) => {
    const c = db.customers.find(x => `${x.firstName} ${x.lastName}` === customerName);
    if (!c) return;
    const d = db.deliveries.filter(x => x.customerId === c.id).sort((a, b) => b.scheduledFor.localeCompare(a.scheduledFor))[0];
    const r = rules[ruleIdx]!;
    const t = templates.find(x => x.id === r.templateId)!;
    const values = valuesFor(d, null, d?.scheduledFor);
    queue({
      ruleId: r.id, customerId: c.id, deliveryId: d?.id ?? null, dedupKey: `${r.id}:${d?.id ?? c.id}`,
      toEmail: c.email, toName: `${c.firstName} ${c.lastName}`, subject: render(t.subject, values), bodyText: render(t.bodyText, values), status, ...extra,
    });
  };
  seedEntry('Frank DeLuca', 0, NotificationStatus.Sent, { attempts: 1, queuedAt: hoursAgo(30), sendAfter: hoursAgo(30), sentAt: hoursAgo(30) });
  seedEntry('Daniella Russo', 1, NotificationStatus.Skipped, { queuedAt: hoursAgo(20), sendAfter: hoursAgo(20) });
  seedEntry('Marcus Bell', 0, NotificationStatus.Failed, { attempts: 5, lastError: 'The mail server refused the connection (timed out after 5 tries).', queuedAt: hoursAgo(10), sendAfter: hoursAgo(9) });
  seedEntry('Greg Olsen', 2, NotificationStatus.HeldForReview, { queuedAt: hoursAgo(5), sendAfter: hoursAgo(5) });
  seedEntry('Tess Nolan', 0, NotificationStatus.Queued, { queuedAt: hoursAgo(1), sendAfter: new Date(Date.now() + 9 * 3600_000).toISOString() });
  outbox.push({
    id: crypto.randomUUID(), ruleId: rules[0]!.id, customerId: null, deliveryId: null, dedupKey: null, toEmail: 'old.address@example.com', toName: 'Old address',
    subject: 'Your Barkfield Road delivery has arrived', bodyText: 'Hello,\n\nYour order was delivered.\n\nThank you,\nBarkfield Road', status: NotificationStatus.Suppressed,
    attempts: 0, lastError: null, queuedAt: hoursAgo(40), sendAfter: hoursAgo(40), sentAt: null,
  });

  // --- DTO shaping ------------------------------------------------------------------------------------
  const statusName = (r: RuleState, value: number | null) =>
    TRIGGERS.find(t => t.kind === r.triggerKind)?.statuses.find(s => s.value === value)?.name ?? String(value);
  const toRule = (r: RuleState): NotificationRule => {
    const t = templates.find(x => x.id === r.templateId)!;
    const isEvent = r.triggerKind < 20;
    return {
      ...r, templateName: t.name, templateTier: t.tier as NotificationRule['templateTier'], triggerKind: r.triggerKind as NotificationRule['triggerKind'],
      audience: r.audience as NotificationRule['audience'], triggerKindName: triggerName(r.triggerKind), audienceName: NAMES.audience[r.audience]!,
      templateTierName: NAMES.tier[t.tier]!, willSend: r.isEnabled && !r.isDryRun, isEventTrigger: isEvent,
      summary: isEvent
        ? `When a ${SUBJECT_NOUN[r.triggerKind] ?? 'record'} becomes ${statusName(r, r.toStatus)}${r.fromStatus == null ? '' : ` from ${statusName(r, r.fromStatus)}`}, send "${t.name}"`
        : `${r.offsetDays} day(s) before, send "${t.name}"`,
    };
  };
  const toTemplate = (t: TemplateState): NotificationTemplate => ({
    ...t, tier: t.tier as NotificationTemplate['tier'], tierName: NAMES.tier[t.tier]!, ruleCount: rules.filter(r => r.templateId === t.id).length,
  });
  const toEntry = (e: EntryState): OutboxEntry => ({
    ...e, status: e.status as OutboxEntry['status'], statusName: NAMES.status[e.status]!,
    ruleName: rules.find(r => r.id === e.ruleId)?.name ?? null,
    customerName: (() => { const c = db.customers.find(x => x.id === e.customerId); return c ? `${c.firstName} ${c.lastName}` : null; })(),
    needsAttention: e.status === NotificationStatus.Failed || e.status === NotificationStatus.HeldForReview,
    isHeldForReview: e.status === NotificationStatus.HeldForReview,
    isWaiting: e.status === NotificationStatus.Queued && e.sendAfter > now(),
  });

  const findRule = (id: string) => { const r = rules.find(x => x.id === id); if (!r) throw new NotFoundError(`Notification rule '${id}' was not found.`); return r; };
  const findTemplate = (id: string) => { const t = templates.find(x => x.id === id); if (!t) throw new NotFoundError(`Notification template '${id}' was not found.`); return t; };
  const findDelivery = (id: string) => { const d = db.deliveries.find(x => x.id === id); if (!d) throw new NotFoundError(`Delivery '${id}' was not found.`); return d; };
  const touch = (x: { updatedAt: string | null; revision: number }) => { x.updatedAt = now(); x.revision++; };
  const usableTemplate = (id: string) => {
    if (findTemplate(id).tier === NotificationTier.System) throw new ValidationError('A system template cannot be driven by a rule — see the notification centre notes.');
  };

  const drain = () => {
    let sent = 0, suppressed = 0, considered = 0;
    for (const e of outbox.filter(x => x.status === NotificationStatus.Queued && x.sendAfter <= now())) {
      considered++;
      if (suppressions.some(s => s.email === e.toEmail)) { e.status = NotificationStatus.Suppressed; suppressed++; continue; }
      if (!settings.isSendingEnabled) { e.status = NotificationStatus.Skipped; continue; }
      // The logging transport "sends" everything.
      e.status = NotificationStatus.Sent; e.attempts++; e.sentAt = now(); sent++;
    }
    return { considered, sent, failed: 0, suppressed, wasFullBatch: false, didNothing: considered === 0 };
  };
  const scheduleDrain = () => { if (options.autoDrain) setTimeout(drain, 3000); };

  return {
    async triggers() { await wait(); return structuredClone(TRIGGERS); },

    async templates() { await wait(); return templates.map(toTemplate).sort((a, b) => a.name.localeCompare(b.name)); },
    async template(id) { await wait(); return toTemplate(findTemplate(id)); },
    async createTemplate(body) {
      await wait();
      if (body.tier === NotificationTier.System) {
        throw new ValidationError('System messages — password resets and staff welcomes — are not sent from the notification centre, so a template cannot be created in that tier.');
      }
      if (!body.name?.trim()) throw new ValidationError('A template needs a name.');
      if (!body.subject?.trim()) throw new ValidationError('A template needs a subject.');
      if (!body.bodyText?.trim()) throw new ValidationError('A template needs a body.');
      const t: TemplateState = { id: crypto.randomUUID(), name: body.name.trim(), tier: body.tier, subject: body.subject.trim(), bodyText: body.bodyText, isSystem: false, createdAt: now(), updatedAt: null, revision: 0 };
      templates.push(t);
      return t.id;
    },
    async rewordTemplate(id, body, revision) {
      await wait();
      const t = findTemplate(id);
      if (revision !== undefined && revision !== t.revision) {
        throw new ConflictError('This template was changed by someone else after this page was loaded. Reload to see their change, then make yours again.');
      }
      if (!body.name.trim() || !body.subject.trim() || !body.bodyText.trim()) throw new ValidationError('A template needs a name, a subject and a body.');
      Object.assign(t, { name: body.name.trim(), subject: body.subject.trim(), bodyText: body.bodyText });
      touch(t);
    },
    async deleteTemplate(id) {
      await wait();
      const t = findTemplate(id);
      if (t.isSystem) throw new ValidationError(`'${t.name}' is a built-in template. It can be reworded but not removed.`);
      const used = rules.filter(r => r.templateId === id).length;
      if (used) throw new ValidationError(`'${t.name}' is still used by ${used} rule(s). Change or remove those first.`);
      templates.splice(templates.indexOf(t), 1);
    },

    async rules() { await wait(); return rules.map(toRule); },
    async rule(id) { await wait(); return toRule(findRule(id)); },
    async createRule(body) {
      await wait();
      usableTemplate(body.templateId);
      const kind = Number(body.triggerKind);
      const isEvent = kind < 20;
      const to = body.toStatus == null ? null : Number(body.toStatus);
      const from = body.fromStatus == null ? null : Number(body.fromStatus);
      const offset = body.offsetDays == null ? null : Number(body.offsetDays);
      if (!body.name?.trim()) throw new ValidationError('A notification rule needs a name.');
      if (body.name.trim().length > 120) throw new ValidationError('A notification rule\'s name cannot exceed 120 characters.');
      if (isEvent && to === null) throw new ValidationError('An event rule has to say which status it reacts to.');
      if (!isEvent && offset === null) throw new ValidationError('A scheduled rule has to say how many days before the event it runs.');
      if (offset !== null && offset < 0) throw new ValidationError('Days before the event cannot be negative.');
      if (isEvent && from !== null && from === to) throw new ValidationError('A rule cannot react to a transition from a status to itself.');
      const r: RuleState = {
        id: crypto.randomUUID(), name: body.name.trim(), templateId: body.templateId, triggerKind: kind, audience: Number(body.audience ?? NotificationAudience.Customer),
        fromStatus: isEvent ? from : null, toStatus: isEvent ? to : null, offsetDays: isEvent ? null : offset,
        // Both deliberate: a rule is never born able to send.
        isEnabled: false, isDryRun: true, createdAt: now(), updatedAt: null, revision: 0,
      };
      rules.push(r);
      return r.id;
    },
    async renameRule(id, name, revision) {
      await wait();
      const r = findRule(id);
      if (revision !== undefined && revision !== r.revision) throw new ConflictError('This rule was changed by someone else after this page was loaded. Reload to see their change, then make yours again.');
      if (!name.trim()) throw new ValidationError('A notification rule needs a name.');
      r.name = name.trim(); touch(r);
    },
    async changeRuleTemplate(id, templateId, revision) {
      await wait();
      const r = findRule(id);
      usableTemplate(templateId);
      if (revision !== undefined && revision !== r.revision) throw new ConflictError('This rule was changed by someone else after this page was loaded. Reload to see their change, then make yours again.');
      r.templateId = templateId; touch(r);
    },
    async setRuleEnabled(id, enabled) { await wait(); const r = findRule(id); r.isEnabled = enabled; touch(r); },
    async setRuleDryRun(id, dryRun) { await wait(); const r = findRule(id); r.isDryRun = dryRun; touch(r); },
    async deleteRule(id) { await wait(); const r = findRule(id); rules.splice(rules.indexOf(r), 1); },

    async preview(ruleId, deliveryId): Promise<NotificationPreview> {
      await wait();
      const r = findRule(ruleId);
      const t = findTemplate(r.templateId);
      const d = findDelivery(deliveryId);
      const c = db.customers.find(x => x.id === d.customerId);
      const sub = db.subscriptions.find(s => s.id === d.subscriptionId);
      const values = valuesFor(d, sub?.displayName, sub?.nextDeliveryDate);
      const subject = render(t.subject, values), bodyText = render(t.bodyText, values);
      const missing = unresolved(subject, bodyText);
      return {
        subject, bodyText, toEmail: c?.email ?? '(no address on file)', toName: c ? `${c.firstName} ${c.lastName}` : '(unknown)',
        unresolvedPlaceholders: missing, isComplete: missing.length === 0,
      };
    },
    async test(ruleId, deliveryId, toEmail) {
      const p = await this.preview(ruleId, deliveryId);
      const me = currentUser();
      const to = toEmail?.trim() || me?.email;
      if (!to) throw new ValidationError('A test send needs an address to send to.');
      // No rule, no customer, no dedup: a test can't use up a customer's daily allowance.
      const e = queue({ deliveryId, toEmail: to, toName: toEmail ? to : me?.name ?? to, subject: `[TEST] ${p.subject}`, bodyText: p.bodyText, status: NotificationStatus.Queued });
      scheduleDrain();
      return e.id;
    },

    async outbox(q) {
      await wait();
      const rows = outbox
        .filter(e => q.status == null || e.status === Number(q.status))
        .filter(e => !q.customerId || e.customerId === q.customerId)
        .filter(e => !q.ruleId || e.ruleId === q.ruleId)
        .filter(e => !q.queuedFrom || e.queuedAt.slice(0, 10) >= q.queuedFrom.slice(0, 10))
        .filter(e => !q.queuedTo || e.queuedAt.slice(0, 10) <= q.queuedTo.slice(0, 10))
        .sort((a, b) => b.queuedAt.localeCompare(a.queuedAt))
        .map(toEntry);
      const pageSize = Math.min(Math.max(Number(q.pageSize ?? 25), 1), 200);
      const pageNumber = Math.max(Number(q.pageNumber ?? 1), 1);
      const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
      return { items: rows.slice((pageNumber - 1) * pageSize, pageNumber * pageSize), totalCount: rows.length, pageNumber, pageSize, totalPages, hasNextPage: pageNumber < totalPages, hasPreviousPage: pageNumber > 1 };
    },
    async outboxEntry(id) {
      await wait();
      const e = outbox.find(x => x.id === id);
      if (!e) throw new NotFoundError(`Notification '${id}' was not found.`);
      return toEntry(e);
    },
    async retry(id) {
      await wait();
      const e = outbox.find(x => x.id === id);
      if (!e) throw new NotFoundError(`Notification '${id}' was not found.`);
      if (e.status === NotificationStatus.Sent) throw new ValidationError('A notification that has already been sent cannot be queued again.');
      Object.assign(e, { status: NotificationStatus.Queued, attempts: 0, lastError: null, sendAfter: now() });
      scheduleDrain();
    },
    async drain() { await wait(); return drain(); },
    async sweep(force) {
      await wait();
      const today = todayDate();
      if (settings.lastSweepDate?.slice(0, 10) === today && !force) {
        return { date: today + 'T00:00:00', considered: 0, queued: 0, alreadyRanToday: true, didNothing: true };
      }
      settings.lastSweepDate = today + 'T00:00:00';
      let considered = 0, queued = 0;
      for (const r of rules.filter(x => x.isEnabled && x.triggerKind === NotificationTriggerKind.BeforeNextDelivery)) {
        const t = findTemplate(r.templateId);
        const target = new Date(Date.now() + (r.offsetDays ?? 0) * 86400_000).toISOString().slice(0, 10);
        for (const s of db.subscriptions.filter(x => x.nextDeliveryDate.slice(0, 10) === target)) {
          considered++;
          // One reminder per subscription per delivery date, however often the sweep runs.
          const key = `${r.id}:${s.id}:${target}`;
          if (outbox.some(e => e.dedupKey === key)) continue;
          const c = db.customers.find(x => x.id === s.customerId);
          if (!c) continue;
          const values = { ...valuesFor(undefined, s.displayName, s.nextDeliveryDate), CustomerFirstName: c.firstName, CustomerLastName: c.lastName, CustomerFullName: `${c.firstName} ${c.lastName}` };
          queue({ ruleId: r.id, customerId: c.id, dedupKey: key, toEmail: c.email, toName: `${c.firstName} ${c.lastName}`, subject: render(t.subject, values), bodyText: render(t.bodyText, values), status: r.isDryRun ? NotificationStatus.Skipped : NotificationStatus.Queued });
          queued++;
        }
      }
      return { date: today + 'T00:00:00', considered, queued, alreadyRanToday: false, didNothing: queued === 0 };
    },

    async settings() { await wait(); return structuredClone({ ...settings, hasQuietHours: settings.quietHoursStartLocal != null, canSendInternal: !!settings.internalRecipientEmail }); },
    async saveSettings(body) {
      await wait();
      const [start, end] = [body.quietHoursStartLocal, body.quietHoursEndLocal].map(v => (v == null ? null : Number(v)));
      if ((start === null) !== (end === null)) throw new ValidationError('Quiet hours need both a start and an end, or neither.');
      if ([start, end].some(h => h !== null && (h! < 0 || h! > 23 || !Number.isInteger(h)))) throw new ValidationError('Quiet hours are whole hours of the day, 0 to 23.');
      if (Number(body.maxPerCustomerPerDay ?? 0) < 0) throw new ValidationError('The daily cap cannot be negative. Use 0 for no cap.');
      Object.assign(settings, {
        isSendingEnabled: body.isSendingEnabled, quietHoursStartLocal: start, quietHoursEndLocal: end,
        maxPerCustomerPerDay: Number(body.maxPerCustomerPerDay ?? 0), internalRecipientEmail: body.internalRecipientEmail?.trim() || null, updatedAt: now(),
      });
    },
    async suppressions() { await wait(); return structuredClone(suppressions); },
    async suppress(body) {
      await wait();
      const email = body.email?.trim().toLowerCase();
      if (!email) throw new ValidationError('An address is required.');
      if (suppressions.some(s => s.email === email)) return;
      suppressions.push({ id: crypto.randomUUID(), email, reason: body.reason, reasonName: NAMES.suppression[Number(body.reason)]!, note: body.note?.trim() || null, createdAt: now() });
    },
    async unsuppress(id) {
      await wait();
      const i = suppressions.findIndex(s => s.id === id);
      if (i < 0) throw new NotFoundError(`Suppression '${id}' was not found.`);
      suppressions.splice(i, 1);
    },
  };
}

