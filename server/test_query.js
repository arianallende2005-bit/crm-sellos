const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { deliveryDate: { sort: 'asc', nulls: 'last' } },
    });
    console.log("Orders found:", orders.length);
    console.log("First order ID:", orders[0]?.id, "DeliveryDate:", orders[0]?.deliveryDate);
    console.log("Last order ID:", orders[orders.length-1]?.id, "DeliveryDate:", orders[orders.length-1]?.deliveryDate);
  } catch (e) {
    console.error("PRISMA ERROR:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}
test();
