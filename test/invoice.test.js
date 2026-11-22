'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function makeOrder(id, items, coupon, billedTotal) {
  return { id, items, coupon, total: billedTotal };
}

function item(id, name, sku, hsn, price, qty, gstRate) {
  return { id, name, sku, hsn, price, qty, gstRate };
}

test('CURRENT BEHAVIOUR: #1001 no-coupon invoice uses 18% and 5% item rates', function () {
  const items = [
    item(8, 'Assam CTC Masala Chai 250g', 'BEV-001', '0902', 140, 2, 18),
    item(2, 'Unpolished Toor Dal 1kg', 'GRN-002', '0713', 165, 2, 5)
  ];
  const order = makeOrder(1001, items, '', 676.90);

  const actual = invoice.computeInvoiceFigures(order);
  const checkout = pricing.computeTotals(items, '');

  assert.deepEqual(actual, {
    subtotal: 610,
    discount: 0,
    tax: 66.9,
    cgst: 33.45,
    sgst: 33.45,
    total: 676.9,
    rows: [
      { name: 'Assam CTC Masala Chai 250g', sku: 'BEV-001', hsn: '0902', qty: 2, price: 140, gstPercent: 18, line: 280, lineTax: 50.4 },
      { name: 'Unpolished Toor Dal 1kg', sku: 'GRN-002', hsn: '0713', qty: 2, price: 165, gstPercent: 5, line: 330, lineTax: 16.5 }
    ]
  });
  assert.equal(checkout.total, 676.9);
  assert.equal(checkout.tax, 66.9);
});

test('CHECKOUT BEHAVIOUR: #1002 SAVE10 discount applies before GST', function () {
  const items = [
    item(1, 'Indrayani Basmati Rice 5kg', 'GRN-001', '1006', 640, 1, 5),
    item(4, 'Cold-Pressed Sunflower Oil 1L', 'OIL-001', '1512', 190, 2, 5)
  ];
  const order = makeOrder(1002, items, 'SAVE10', 963.90);

  const actual = invoice.computeInvoiceFigures(order);
  const checkout = pricing.computeTotals(items, 'SAVE10');

  assert.deepEqual(actual, {
    subtotal: 1020,
    discount: 102,
    tax: 45.9,
    cgst: 22.95,
    sgst: 22.95,
    total: 963.9,
    rows: [
      { name: 'Indrayani Basmati Rice 5kg', sku: 'GRN-001', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, lineTax: 28.8 },
      { name: 'Cold-Pressed Sunflower Oil 1L', sku: 'OIL-001', hsn: '1512', qty: 2, price: 190, gstPercent: 5, line: 380, lineTax: 17.1 }
    ]
  });
  assert.equal(checkout.discount, 102);
  assert.equal(checkout.tax, 45.9);
  assert.equal(checkout.total, 963.9);
});

test('CHECKOUT BEHAVIOUR: #1004 SAVE10 invoice honors the configured ₹150 cap', function () {
  const items = [
    item(5, 'Cold-Pressed Groundnut Oil 5L', 'OIL-002', '1508', 1120, 2, 5)
  ];
  const order = makeOrder(1004, items, 'SAVE10', 2194.50);

  const actual = invoice.computeInvoiceFigures(order);
  const checkout = pricing.computeTotals(items, 'SAVE10');

  assert.deepEqual(actual, {
    subtotal: 2240,
    discount: 150,
    tax: 104.5,
    cgst: 52.25,
    sgst: 52.25,
    total: 2194.5,
    rows: [
      { name: 'Cold-Pressed Groundnut Oil 5L', sku: 'OIL-002', hsn: '1508', qty: 2, price: 1120, gstPercent: 5, line: 2240, lineTax: 104.5 }
    ]
  });
  assert.equal(actual.discount, checkout.discount);
  assert.equal(actual.tax, checkout.tax);
  assert.equal(actual.total, checkout.total);
});

test('CURRENT BEHAVIOUR: #1008 no-coupon invoice totals both 18% lines', function () {
  const items = [
    item(8, 'Assam CTC Masala Chai 250g', 'BEV-001', '0902', 140, 1, 18),
    item(12, 'Kokum Sherbet Concentrate 750ml', 'BEV-003', '2106', 180, 2, 18)
  ];
  const order = makeOrder(1008, items, '', 590);

  const actual = invoice.computeInvoiceFigures(order);
  const checkout = pricing.computeTotals(items, '');

  assert.deepEqual(actual, {
    subtotal: 500,
    discount: 0,
    tax: 90,
    cgst: 45,
    sgst: 45,
    total: 590,
    rows: [
      { name: 'Assam CTC Masala Chai 250g', sku: 'BEV-001', hsn: '0902', qty: 1, price: 140, gstPercent: 18, line: 140, lineTax: 25.2 },
      { name: 'Kokum Sherbet Concentrate 750ml', sku: 'BEV-003', hsn: '2106', qty: 2, price: 180, gstPercent: 18, line: 360, lineTax: 64.8 }
    ]
  });
  assert.equal(checkout.tax, 90);
  assert.equal(checkout.total, 590);
});

test('CORRECT BEHAVIOUR: saved orders match checkout HSN GST, discounts and totals', function () {
  // Persisted order lines have price, qty, and HSN; gstRate is not saved by routes/orders.js.
  const scenarios = [
    {
      id: 1001,
      coupon: '',
      total: 676.90,
      items: [
        { id: 8, name: 'Assam CTC Masala Chai 250g', sku: 'BEV-001', hsn: '0902', price: 140, qty: 2 },
        { id: 2, name: 'Unpolished Toor Dal 1kg', sku: 'GRN-002', hsn: '0713', price: 165, qty: 2 }
      ]
    },
    {
      id: 1002,
      coupon: 'SAVE10',
      total: 963.90,
      items: [
        { id: 1, name: 'Indrayani Basmati Rice 5kg', sku: 'GRN-001', hsn: '1006', price: 640, qty: 1 },
        { id: 4, name: 'Cold-Pressed Sunflower Oil 1L', sku: 'OIL-001', hsn: '1512', price: 190, qty: 2 }
      ]
    },
    {
      id: 1004,
      coupon: 'SAVE10',
      total: 2194.50,
      items: [
        { id: 5, name: 'Cold-Pressed Groundnut Oil 5L', sku: 'OIL-002', hsn: '1508', price: 1120, qty: 2 }
      ]
    },
    {
      id: 1008,
      coupon: '',
      total: 590,
      items: [
        { id: 8, name: 'Assam CTC Masala Chai 250g', sku: 'BEV-001', hsn: '0902', price: 140, qty: 1 },
        { id: 12, name: 'Kokum Sherbet Concentrate 750ml', sku: 'BEV-003', hsn: '2106', price: 180, qty: 2 }
      ]
    }
  ];

  scenarios.forEach(function (scenario) {
    const order = makeOrder(scenario.id, scenario.items, scenario.coupon, scenario.total);
    const actual = invoice.computeInvoiceFigures(order);
    const checkout = pricing.computeTotals(scenario.items, scenario.coupon);
    const expectedRows = checkout.lines.map(function (line, index) {
      const source = scenario.items[index];
      return {
        name: source.name,
        sku: source.sku,
        hsn: source.hsn,
        qty: source.qty,
        price: source.price,
        gstPercent: line.gstPercent,
        line: line.gross,
        lineTax: line.tax
      };
    });

    assert.deepEqual(actual.rows, expectedRows, 'order #' + scenario.id + ' rows');
    assert.deepEqual({
      subtotal: actual.subtotal,
      discount: actual.discount,
      tax: actual.tax,
      cgst: actual.cgst,
      sgst: actual.sgst,
      total: actual.total
    }, {
      subtotal: checkout.subtotal,
      discount: checkout.discount,
      tax: checkout.tax,
      cgst: checkout.cgst,
      sgst: checkout.sgst,
      total: checkout.total
    }, 'order #' + scenario.id + ' totals');
    assert.equal(actual.total, scenario.total, 'order #' + scenario.id + ' billed total');
  });
});
