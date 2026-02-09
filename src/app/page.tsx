import ShippingDataTable from "@/components/ShippingDataTable";

export default function Page() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">
            Shipping Data Throughput
          </h1>
        </div>

        <ShippingDataTable />
      </div>
    </div>
  );
}