import axios from 'axios'
import LiveAsset from '../../../components/Asset/page';

export default async function LiveAssetPage() {
  console.log('inside LiveAssetPage');

  try {
    const { data: response } = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL!}/api/v1/candles?duration=1m&symbol=BTCUSDT&startTime=2025-09-07T18:00:00.000Z&endTime=2025-09-07T20:00:00.000Z`);
    console.log('repsonse :', response);

    const { data: candles } = response
    console.log('candles : ', candles);

    return (
      <>
        <p>Hello World1</p>
        <LiveAsset candles={candles} symbol='BTCUSDT'/>
      </>
    )
  } catch (error) {
    console.log('ERROR : ', error);
    return (
      <>
        <p>Failed to retrive candles</p>
      </>
    )
  }

}