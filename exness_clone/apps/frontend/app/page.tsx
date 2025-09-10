"use client"
import { useEffect, useState } from "react";
import { getLivePrices, getSocket } from "../lib/getSocket";
import { useRouter } from "next/navigation";

export default function Home() {
  const [socket, setSocket] = useState<any>(null);
  const [livePrices, setLivePrices] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const temp = getSocket();
    setSocket(temp);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const temp = getLivePrices();
      const temp2 = [...temp];
      console.log("Setting livePrices");
      setLivePrices(temp2);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  function handleVisitLiveAsset(symbol: string) {
    router.push(`/live/${symbol}`);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-6 flex flex-col items-center">
      <h1 className="text-3xl font-bold text-indigo-700 mb-10">
        📊 Live Market Prices
      </h1>

      {!livePrices ? (
        <p className="text-indigo-500 text-lg animate-pulse">
          Fetching latest market data...
        </p>
      ) : (
        <div className="grid gap-6 w-full max-w-6xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[...livePrices].map(([symbol, liveData]) => (
            <div
              key={symbol}
              onClick={() => handleVisitLiveAsset(symbol)}
              className="cursor-pointer rounded-2xl border border-indigo-100 bg-white shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200 p-6"
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-indigo-700">
                  {symbol}
                </h2>
                <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Live
                </span>
              </div>

              {/* Prices */}
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-green-50 rounded-lg px-3 py-2">
                  <span className="text-sm text-gray-600">Sell Price</span>
                  <span className="font-semibold text-green-700">
                    {liveData.sellPrice}
                  </span>
                </div>
                <div className="flex justify-between items-center bg-blue-50 rounded-lg px-3 py-2">
                  <span className="text-sm text-gray-600">Buy Price</span>
                  <span className="font-semibold text-blue-700">
                    {liveData.buyPrice}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


// "use client"
// import { useEffect, useState } from "react";
// import { getLivePrices, getSocket } from "../lib/getSocket";
// import { useRouter } from "next/navigation";

// export default function Home() {
//   const [socket,setSocket]=useState(null)
//   const [livePrices,setLivePrices]=useState(null)
//   const router = useRouter()

//   useEffect(()=>{    

//     const temp = getSocket()
//     setSocket(temp)

//   },[])

//   useEffect(()=>{
//     setInterval(()=>{
//       const temp=getLivePrices()
//       const temp2=[...temp]
//       console.log('Setting livePrices');
      
//       setLivePrices(temp2)
//     },1000)

//   },[])

//   function handleVisitLiveAsset(symbol:string){
//     router.push(`/live/${symbol}`)
//   }


//   return (
//     <div >
//       <p>Hello World</p>

//       {livePrices && [...livePrices].map(([symbol,liveData])=>(
//           <div key={symbol} onClick={()=>handleVisitLiveAsset(symbol)}>
//             <p>{symbol}, sellPrice : {liveData.sellPrice}, buyPrice : {liveData.buyPrice}</p>
//           </div>
//       ))}
//     </div>
//   );
// }
