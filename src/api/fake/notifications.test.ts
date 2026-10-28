// The notifications fake must follow the API (NotificationAdminService, NotificationRule.cs, the outbox).
import { NotificationAudience, NotificationStatus, NotificationTier, NotificationTriggerKind } from '../generated/enums';
import { ConflictError } from '../errors';
import { createFakeApi } from '.';

const fresh = () => createFakeApi({ latency: false, persistSession: false });

describe('rules', () => {
  it('are born disabled and in dry run, and say what they do in a sentence', async () => {
    const api = fresh();
    const template = (await api.notifications.templates()).find(t => t.name === 'Payment taken')!;
    const id = await api.notifications.createRule({
      name: 'Receipts', templateId: template.id, triggerKind: NotificationTriggerKind.PaymentStatus as never,
      audience: NotificationAudience.Customer as never, fromStatus: null, toStatus: 2, offsetDays: null,
    });
    const rule = await api.notifications.rule(id);
    expect(rule).toMatchObject({ isEnabled: false, isDryRun: true, willSend: false, isEventTrigger: true });
    expect(rule.summary).toBe('When a payment becomes Paid, send "Payment taken"');
    expect((await api.notifications.template(template.id)).ruleCount).toBe(1);
  });

  it('refuse an event rule with no status, a scheduled one with no days, and from-equals-to', async () => {
    const api = fresh();
    const templateId = (await api.notifications.templates())[0]!.id;
    const base = { name: 'x', templateId, audience: NotificationAudience.Customer as never, fromStatus: null, toStatus: null, offsetDays: null };
    await expect(api.notifications.createRule({ ...base, triggerKind: NotificationTriggerKind.DeliveryStatus as never })).rejects.toThrow('An event rule has to say which status it reacts to.');
    await expect(api.notifications.createRule({ ...base, triggerKind: NotificationTriggerKind.BeforeNextDelivery as never })).rejects.toThrow('A scheduled rule has to say how many days before the event it runs.');
    await expect(api.notifications.createRule({ ...base, triggerKind: NotificationTriggerKind.DeliveryStatus as never, fromStatus: 5, toStatus: 5 })).rejects.toThrow('A rule cannot react to a transition from a status to itself.');
  });

  it('refuse a stale rename', async () => {
    const api = fresh();
    const [rule] = await api.notifications.rules();
    await api.notifications.renameRule(rule!.id, 'Renamed', rule!.revision);
    await expect(api.notifications.renameRule(rule!.id, 'Again', rule!.revision)).rejects.toBeInstanceOf(ConflictError);
  });
});

describe('templates', () => {
  it('can be reworded but a built-in one is never deleted, nor one a rule uses', async () => {
    const api = fresh();
    const builtIn = (await api.notifications.templates()).find(t => t.name === 'Delivery confirmation')!;
    await expect(api.notifications.deleteTemplate(builtIn.id)).rejects.toThrow('is a built-in template');
    const own = await api.notifications.createTemplate({ name: 'Mine', tier: NotificationTier.Operational as never, subject: 'Hi', bodyText: 'Hello {{CustomerFirstName}}' });
    const [rule] = await api.notifications.rules();
    await api.notifications.changeRuleTemplate(rule!.id, own);
    await expect(api.notifications.deleteTemplate(own)).rejects.toThrow("'Mine' is still used by 1 rule(s)");
    await expect(api.notifications.createTemplate({ name: 'S', tier: NotificationTier.System as never, subject: 's', bodyText: 'b' })).rejects.toThrow('cannot be created in that tier');
  });
});

describe('preview and the outbox', () => {
  it('leaves an unfillable placeholder visible, and lists it', async () => {
    const api = fresh();
    const rule = (await api.notifications.rules()).find(r => r.name === 'Tell the customer when a delivery arrives')!;
    const open = api.fake.db.deliveries.find(d => !d.completedAt)!; // not delivered, so DeliveredAt can't fill
    const p = await api.notifications.preview(rule.id, open.id);
    expect(p.bodyText).toContain('{{DeliveredAt}}');
    expect(p.unresolvedPlaceholders).toEqual(['DeliveredAt']);
    expect(p.isComplete).toBe(false);
  });

  it('holds a substitution notice for review, and lets a person release it', async () => {
    const api = fresh();
    const held = (await api.notifications.outbox({ status: NotificationStatus.HeldForReview as never })).items[0]!;
    expect(held).toMatchObject({ isHeldForReview: true, needsAttention: true, customerName: 'Greg Olsen' });
    await api.notifications.retry(held.id);
    expect((await api.notifications.outboxEntry(held.id)).status).toBe(NotificationStatus.Queued);
    const sent = (await api.notifications.outbox({ status: NotificationStatus.Sent as never })).items[0]!;
    await expect(api.notifications.retry(sent.id)).rejects.toThrow('already been sent');
  });

  it('runs the reminder sweep once a day unless forced', async () => {
    const api = fresh();
    expect((await api.notifications.sweep()).alreadyRanToday).toBe(false);
    expect((await api.notifications.sweep()).alreadyRanToday).toBe(true);
    expect((await api.notifications.sweep(true)).alreadyRanToday).toBe(false);
  });

  it('says plainly that nothing is really sent', async () => {
    expect((await fresh().notifications.settings()).transportIsReal).toBe(false);
  });
});
