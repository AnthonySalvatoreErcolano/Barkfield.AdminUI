// Fake data for the Autoship Admin UI kit.
window.BR_DATA = (() => {
  const subs = [
    { id: 1042, name: 'Daniella Russo', email: 'daniella.russo@example.com', phone: '(631) 555-0142', town: 'East Northport', pup: 'Biscuit', breed: 'Golden Retriever', plan: 'Open Farm Lamb & Oat', size: '24 lb', freq: 4, next: 'Thu, Oct 2', route: 'A', status: 'Active', total: 89.99, since: 'Mar 2023', tags: ['Grain-free'] },
    { id: 1043, name: 'Marcus Bell', email: 'marcus.bell@example.com', phone: '(631) 555-0199', town: 'Huntington', pup: 'Juniper', breed: 'Australian Shepherd', plan: 'Raw Bistro Beef', size: '12 lb', freq: 2, next: 'Fri, Oct 3', route: 'B', status: 'Past due', total: 64.5, since: 'Jan 2024', tags: ['Raw'] },
    { id: 1047, name: 'Priya Shah', email: 'priya.s@example.com', phone: '(516) 555-0110', town: 'Syosset', pup: 'Mochi', breed: 'Shiba Inu', plan: 'Bakery Box — Large', size: '1 box', freq: 6, next: '—', route: 'C', status: 'Paused', total: 38.0, since: 'Aug 2024', tags: ['Bakery'] },
    { id: 1051, name: 'Tom Kearney', email: 'tkearney@example.com', phone: '(631) 555-0173', town: 'Northport', pup: 'Rufus', breed: 'Labrador', plan: 'Stella & Chewy’s Chicken', size: '24 lb', freq: 4, next: 'Mon, Oct 6', route: 'A', status: 'Active', total: 112.4, since: 'Nov 2022', tags: ['Senior'] },
    { id: 1055, name: 'Alicia Moreno', email: 'alicia.m@example.com', phone: '(631) 555-0128', town: 'Commack', pup: 'Pepper & Salt', breed: 'Mini Schnauzers', plan: 'Farmina N&D Pumpkin', size: '12 lb', freq: 3, next: 'Thu, Oct 2', route: 'B', status: 'Active', total: 71.25, since: 'May 2023', tags: ['2 pups'] },
    { id: 1058, name: 'Greg Olsen', email: 'golsen@example.com', phone: '(516) 555-0161', town: 'Greenlawn', pup: 'Duke', breed: 'German Shepherd', plan: 'Open Farm Salmon', size: '24 lb', freq: 4, next: 'Tue, Oct 7', route: 'C', status: 'Active', total: 94.0, since: 'Feb 2024', tags: ['Chicken allergy'] },
    { id: 1061, name: 'Hannah Lee', email: 'hannah.lee@example.com', phone: '(631) 555-0107', town: 'Centerport', pup: 'Olive', breed: 'Cavalier', plan: 'Honest Kitchen Base Mix', size: '10 lb', freq: 6, next: 'Wed, Oct 8', route: 'A', status: 'Active', total: 58.99, since: 'Jun 2024', tags: [] },
    { id: 1064, name: 'Sam Whitaker', email: 'samw@example.com', phone: '(631) 555-0184', town: 'Kings Park', pup: 'Bear', breed: 'Bernese Mountain Dog', plan: 'Raw Bistro Lamb', size: '24 lb', freq: 2, next: '—', route: 'B', status: 'Cancelled', total: 0, since: 'Sep 2023', tags: ['Raw'] }
  ];
  const tone = { Active: 'success', 'Past due': 'danger', Paused: 'warning', Cancelled: 'neutral', Scheduled: 'info' };
  const orders = [
    { id: 'BR-20931', date: 'Sep 4, 2025', items: 'Open Farm Lamb & Oat 24 lb, Pumpkin Bites', total: 97.49, status: 'Delivered' },
    { id: 'BR-20417', date: 'Aug 7, 2025', items: 'Open Farm Lamb & Oat 24 lb', total: 89.99, status: 'Delivered' },
    { id: 'BR-19880', date: 'Jul 10, 2025', items: 'Open Farm Lamb & Oat 24 lb, Birthday Pupcake', total: 104.99, status: 'Delivered' },
    { id: 'BR-19302', date: 'Jun 12, 2025', items: 'Open Farm Lamb & Oat 24 lb', total: 89.99, status: 'Refunded' }
  ];
  const week = [
    { day: 'Mon', date: 'Sep 29', stops: [{ n: 'Hannah Lee', r: 'A', t: '9–12' }, { n: 'Chris Pardo', r: 'A', t: '9–12' }, { n: 'Nina Voss', r: 'C', t: '1–4' }] },
    { day: 'Tue', date: 'Sep 30', stops: [{ n: 'Greg Olsen', r: 'C', t: '9–12' }, { n: 'Leah Tran', r: 'B', t: '1–4' }] },
    { day: 'Wed', date: 'Oct 1', stops: [{ n: 'Ben Carter', r: 'B', t: '9–12' }, { n: 'Jo Fitz', r: 'A', t: '1–4' }, { n: 'Ravi Patel', r: 'B', t: '1–4' }, { n: 'Ann Cho', r: 'C', t: '1–4' }] },
    { day: 'Thu', date: 'Oct 2', stops: [{ n: 'Daniella Russo', r: 'A', t: '9–12' }, { n: 'Alicia Moreno', r: 'B', t: '9–12' }, { n: 'Kate Dunn', r: 'A', t: '1–4' }] },
    { day: 'Fri', date: 'Oct 3', stops: [{ n: 'Marcus Bell', r: 'B', t: '9–12', hold: true }, { n: 'Pat Kim', r: 'C', t: '1–4' }] },
    { day: 'Sat', date: 'Oct 4', stops: [{ n: 'Store pickup ×6', r: 'P', t: 'All day' }] }
  ];
  return { subs, tone, orders, week };
})();
