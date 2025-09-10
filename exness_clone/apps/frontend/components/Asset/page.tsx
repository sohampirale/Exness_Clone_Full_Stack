"use client"

import { useEffect, useState, useRef } from "react"
import { TrendingUp, TrendingDown, Activity } from "lucide-react"
import { ComposedChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine } from "recharts"
import { getLivePrices, getSocket } from "../../lib/getSocket"

interface CandleData {
  bucket: string
  symbol: string
  open: string
  high: string
  low: string
  close: string
}

interface LiveAssetProps {
  candles: CandleData[]
  symbol: string
}

export default function LiveAsset({ candles, symbol }: LiveAssetProps) {
  const [liveBuyPrice, setLiveBuyPrice] = useState<number>()
  const [liveSellPrice, setLiveSellPrice] = useState<number>()
  const [livePrice, setLivePrice] = useState<number>()
  const [priceChange, setPriceChange] = useState<number>(0)
  const [isPositive, setIsPositive] = useState<boolean>(true)
  const intervalRef = useRef<NodeJS.Timeout>()
  const [socket,setSocket]=useState()

    setInterval(()=>{
      const livePrices =getLivePrices();
      const liveData=livePrices.get(symbol)
      console.log('liveData : ',liveData);
      if(liveData){
        const {buyPrice,sellPrice,markPrice}=liveData
        setLiveBuyPrice(buyPrice)
        setLivePrice(sellPrice)
        setLiveSellPrice(markPrice)
      }
    },1000)


    useEffect(() => {

    const temp = getSocket()
    setSocket(temp)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    intervalRef.current = setInterval(() => {
      const livePrices = getLivePrices()
      const liveData = livePrices.get(symbol)
      
      if (liveData) {
        const { buyPrice, sellPrice, markPrice } = liveData
        const currentPrice = markPrice || buyPrice
        
        if (livePrice) {
          const change = currentPrice - livePrice
          setPriceChange(change)
          setIsPositive(change >= 0)
        }
        
        setLiveBuyPrice(buyPrice)
        setLiveSellPrice(sellPrice)
        setLivePrice(currentPrice)
      }
    }, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [symbol, livePrice])

  const processedCandles = candles.map((candle, index) => {
    const open = parseFloat(candle.open)
    const close = parseFloat(candle.close)
    const high = parseFloat(candle.high)
    const low = parseFloat(candle.low)
    const isGreen = close >= open
    
    return {
      index,
      time: new Date(candle.bucket).toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      open,
      close,
      high,
      low,
      bodyHeight: Math.abs(close - open),
      bodyStart: Math.min(open, close),
      wickHeight: high - low,
      wickStart: low,
      isGreen,
      color: isGreen ? '#10b981' : '#ef4444'
    }
  })

  // Custom candlestick bar component
  const CandlestickBar = (props: any) => {
    const { payload, x, y, width, height } = props
    if (!payload) return null

    const { open, close, high, low, isGreen } = payload
    const color = isGreen ? '#10b981' : '#ef4444'
    const bodyHeight = Math.abs(close - open)
    const wickWidth = 1
    const bodyWidth = Math.max(width * 0.6, 2)
    const centerX = x + width / 2

    // Calculate positions for high/low chart
    const chartHeight = height
    const priceRange = high - low
    const openY = y + ((high - open) / priceRange) * chartHeight
    const closeY = y + ((high - close) / priceRange) * chartHeight
    const highY = y
    const lowY = y + chartHeight

    const bodyTop = Math.min(openY, closeY)
    const bodyBottom = Math.max(openY, closeY)

    return (
      <g>
        {/* Wick (high-low line) */}
        <line
          x1={centerX}
          y1={highY}
          x2={centerX}
          y2={lowY}
          stroke={color}
          strokeWidth={wickWidth}
        />
        {/* Body */}
        <rect
          x={centerX - bodyWidth / 2}
          y={bodyTop}
          width={bodyWidth}
          height={Math.max(bodyBottom - bodyTop, 1)}
          fill={isGreen ? color : 'transparent'}
          stroke={color}
          strokeWidth={1}
        />
      </g>
    )
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload
      return (
        <div className="bg-gray-900 border border-gray-700 p-3 rounded-lg shadow-lg">
          <p className="text-gray-300 text-sm mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <p className="text-blue-400">O: ${parseFloat(data.open).toLocaleString()}</p>
            <p className="text-green-400">H: ${parseFloat(data.high).toLocaleString()}</p>
            <p className="text-red-400">L: ${parseFloat(data.low).toLocaleString()}</p>
            <p className="text-yellow-400">C: ${parseFloat(data.close).toLocaleString()}</p>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Live Trading Dashboard</h1>
          <div className="flex items-center justify-center gap-2 text-gray-600">
            <Activity className="w-5 h-5" />
            <span className="text-lg font-medium">{symbol}</span>
          </div>
        </div>

        {/* Live Price Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Live Price */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wide">Live Price</h3>
                <p className="text-3xl font-bold text-gray-800 mt-1">
                  ${livePrice?.toLocaleString() || '---'}
                </p>
                {priceChange !== 0 && (
                  <div className={`flex items-center mt-2 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {isPositive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                    <span className="font-medium">
                      {isPositive ? '+' : ''}{priceChange.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
              <div className={`p-3 rounded-full ${isPositive ? 'bg-green-100' : 'bg-red-100'}`}>
                {isPositive ? 
                  <TrendingUp className={`w-8 h-8 ${isPositive ? 'text-green-600' : 'text-red-600'}`} /> : 
                  <TrendingDown className={`w-8 h-8 ${isPositive ? 'text-green-600' : 'text-red-600'}`} />
                }
              </div>
            </div>
          </div>

          {/* Buy Price */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wide">Buy Price</h3>
            <p className="text-2xl font-bold text-green-600 mt-1">
              ${liveBuyPrice?.toLocaleString() || '---'}
            </p>
            <p className="text-gray-400 text-sm mt-2">Best Ask</p>
          </div>

          {/* Sell Price */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
            <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wide">Sell Price</h3>
            <p className="text-2xl font-bold text-red-600 mt-1">
              ${liveSellPrice?.toLocaleString() || '---'}
            </p>
            <p className="text-gray-400 text-sm mt-2">Best Bid</p>
          </div>
        </div>

        {/* Candlestick Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Price Chart</h2>
            <p className="text-gray-600">Candlestick view of recent price movements</p>
          </div>
          
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={processedCandles} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis 
                  dataKey="time" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  domain={['dataMin - 100', 'dataMax + 100']}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                />
                <Tooltip content={<CustomTooltip />} />
                {livePrice && (
                  <ReferenceLine 
                    y={livePrice} 
                    stroke="#3B82F6" 
                    strokeDasharray="5 5" 
                    label={{ value: "Live Price", position: "topRight" }}
                  />
                )}
                <Bar 
                  dataKey="high"
                  shape={<CandlestickBar />}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Chart Legend */}
          <div className="flex items-center justify-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-gray-600">Bullish (Green)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-gray-600">Bearish (Red)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-2 bg-blue-500 rounded" style={{ clipPath: 'polygon(0 0, 100% 0, 80% 100%, 0% 100%)' }}></div>
              <span className="text-gray-600">Live Price</span>
            </div>
          </div>
        </div>

        {/* Market Summary */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Market Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-gray-500 text-sm">Total Candles</p>
              <p className="text-2xl font-bold text-gray-800">{candles.length}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Highest</p>
              <p className="text-2xl font-bold text-green-600">
                ${Math.max(...candles.map(c => parseFloat(c.high))).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Lowest</p>
              <p className="text-2xl font-bold text-red-600">
                ${Math.min(...candles.map(c => parseFloat(c.low))).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Spread</p>
              <p className="text-2xl font-bold text-blue-600">
                ${liveBuyPrice && liveSellPrice ? (liveBuyPrice - liveSellPrice).toLocaleString() : '---'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// "use client"

// import { useEffect, useState } from "react"
// import { getLivePrices, getSocket } from "../../lib/getSocket";

// export default function LiveAsset({candles,symbol}:{candles:any,symbol:string}){
//   const [socket,setSocket]=useState();
//   const [liveBuyPrice,setLiveBuyPrice]=useState()
//   const [liveSellPrice,setLiveSellPrice]=useState()
//   const [livePrice,setLivePrice]=useState()
  
//   useEffect(()=>{
//     const temp = getSocket();
//     setSocket(socket)

//     setInterval(()=>{
//       const livePrices =getLivePrices();
//       const liveData=livePrices.get(symbol)
//       console.log('liveData : ',liveData);
//       const {buyPrice,sellPrice,markPrice}=liveData
//       setLiveBuyPrice(buyPrice)
//       setLivePrice(sellPrice)
//       setLiveSellPrice(markPrice)
//     },1000)
//   })



//   return (
//     <>
//       <p>Hello World</p>
//       <p>Live Buy Price : {liveBuyPrice}</p>
//       <p>Live Sell Price : {liveSellPrice}</p>
//       <p>Live Price : {livePrice}</p>      

//       {JSON.stringify(candles)}
//     </>
//   )
// }
