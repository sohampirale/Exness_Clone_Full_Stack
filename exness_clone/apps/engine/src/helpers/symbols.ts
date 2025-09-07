import { livePrices } from "../variables/index.js";
// import { manageBuyPQS, manageSellPQS } from "./PQmanager.ts";

export let reqSymbols=[]

export async function setReqSymbols(subscriber:any){
    try {
        
        reqSymbols = await subscriber.lRange("reqSymbols", 0, -1); 
        if(!reqSymbols || (Array.isArray(reqSymbols) && reqSymbols.length==0)){
            setTimeout(()=>{
                setReqSymbols(subscriber)
                return
            },2000)
            return
        } 

        reqSymbols.forEach((symbol:string)=>{

            subscriber.subscribe(symbol,(dataStr:any)=>{
                const data=JSON.parse(dataStr)
                data.symbol=symbol;
                livePrices.set(symbol,data)

                if(symbol=='BTCUSDT'){
                    console.log('buyPrice price of bitcoin is : ',data.buyPrice);
                    console.log('sellPrice price of bitcoin is : ',data.sellPrice);
                }
                console.log('Data received for symbol ',symbol,' is : ',data);
                manageBuyPQS(data)
                manageSellPQS(data)
            })
        })
    } catch (error) {
        
    }
}