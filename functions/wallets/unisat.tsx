import GetCookie from '../cookies/getCookie';
import SetCookie from '../cookies/setCookie';
import bitcore from 'bitcore-lib';
import crypto from 'crypto';
import { enqueueSnackbar } from 'notistack';


export const handleUnisat = async () => {
  // @ts-ignore
  let uniSat = window.unisat;
  let cookie = GetCookie('userId');

  if (typeof uniSat !== 'undefined' && cookie == '') {
    try {
      const address = await uniSat.requestAccounts();
      SetCookie('address', address[0])
      SetCookie('wallet', 'unisat')
      return getSignature();
    } catch (e) {
      console.log("connect failed")
    }
  } 
}

export const getSignature = async () => {
  const message = crypto.randomBytes(16).toString('hex');
  const hash = bitcore.crypto.Hash.sha256(Buffer.from(message)).toString('hex');
  let publicKey = '';
  let sign = '';

  // @ts-ignore
  let uniSat =  window.unisat;
  try {
    sign = await uniSat.signMessage(hash);
    publicKey = await uniSat.getPublicKey();
  } catch (e) {
    console.log(e);
  }
}

export const signMessage = async (value: string) => {
  const hash = bitcore.crypto.Hash.sha256(Buffer.from(value)).toString('hex');
  let publicKey = '';
  let sign = '';

  // @ts-ignore
  let uniSat = window.unisat;
  try {
    sign = await uniSat.signMessage(hash);
    publicKey = await uniSat.getPublicKey();
    let userId = '';
    if(sign && publicKey && GetCookie('userId') == '') {
      // @ts-ignore
    }
    if (userId || GetCookie('userId') != '') {
      return { publicKey: publicKey, signature: sign };
    }else{
      return { publicKey: "", signature:""};
    }
  } catch (e) {
    console.log(e);
    enqueueSnackbar('Dismissed', {variant: 'error', anchorOrigin: {horizontal: 'left', vertical: 'top'}});
    return { publicKey: "", signature:""}
  }
}