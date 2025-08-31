import prisma from "db/client"

export default async function Home() {
  const response = await prisma.binance_mark_prices.findMany();
  return (
    <div>
      <p>Response</p>
      {JSON.stringify(response)}
    </div>
  );
}
