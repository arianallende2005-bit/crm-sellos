const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const user = await prisma.user.create({ data: { username: 'testuser', password: 'pwd', role: 'cliente' } });
    await prisma.order.create({ data: { clientId: user.id, productName: 'Order 1', deliveryDate: new Date('2026-06-01') } });
    await prisma.order.create({ data: { clientId: user.id, productName: 'Order 2', deliveryDate: null } });
    await prisma.order.create({ data: { clientId: user.id, productName: 'Order 3', deliveryDate: new Date('2026-05-25') } });

    const orders = await prisma.order.findMany({
      orderBy: { deliveryDate: { sort: 'asc', nulls: 'last' } },
    });
    console.log("Orders in order:");
    orders.forEach(o => console.log(o.productName, o.deliveryDate));
  } catch (e) {
    console.error("PRISMA ERROR:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}
test();
