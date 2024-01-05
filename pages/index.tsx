import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
require('dotenv').config();
import { handleUnisat } from "../functions/wallets/unisat";
import { handleXverse } from "../functions/wallets/xverse";
import GetCookie from "../functions/cookies/getCookie";
import SetCookie from "../functions/cookies/setCookie";
const stakeAddress = "bc1phffe042p35v2httv5zn3s6x349j5se3z4zs39ancx8etr7waptcq0hmjul"
declare global {
  interface Window {
    unisat: any;
    xverse: any;
  }
}

export default function Home() {
  const [wallectModal, setWallectModal] = useState(false);
  const [address, setAddress] = useState("");
  const [stakingScanModal, setStakingScanModal] = useState(false);
  const [stakeAmount, setStakeAmount] = useState(0);
  const [feeRate, setFeeRate] = useState(0);
  const [claimableAmount, setClaimableAmount] = useState("0");
  const [stakedAmount, setStakedAmount] = useState("0");
  const handleConnectWallectOpen = () => {
    if (address == "") {
      setWallectModal(true);
    } else {
      setAddress("");
      SetCookie("address", "");
    }
  };
  const handleStakingScanModal = () => {
    if (address == "") {
      toast("Please connect wallet", {
        hideProgressBar: false,
        autoClose: 2000,
        type: "error",
        position: toast.POSITION.BOTTOM_RIGHT,
      });
    } else {
      setStakingScanModal(true);
    }
  };
  const getSubstring = (address) => {
    const solPublic =
      address.substring(0, 4) + ".." + address.substring(address.length - 4);
    return solPublic;
  };

  const handleSetXverse = async () => {
    const payload = await handleXverse();
    setAddress(GetCookie("address"));
    setWallectModal(false);
  };
  const handleSetUnisat = async () => {
    const payload = await handleUnisat();
    setAddress(GetCookie("address"));
    setWallectModal(false);
  };
  const handleChangeStakeAmount = (event) => {
    setStakeAmount(event.target.value);
  };
  const handleChangeFeeRate = (event) => {
    setFeeRate(event.target.value);
  };
  const stake = async () => {
    if (stakeAmount == 0 || feeRate == 0) {
      toast("Please Input Amount and FeeRate", {
        hideProgressBar: false,
        autoClose: 2000,
        type: "error",
        position: toast.POSITION.BOTTOM_RIGHT,
      });
    } else {
      console.log(GetCookie("wallet"));
      if (GetCookie("wallet") == "unisat") {
        let inscriptionList = await window.unisat.getInscriptions();
        let a = 0;
        for (let i = 0; i < inscriptionList.list.length; i++) {
          const response = await axios.get(
            `https://open-api.unisat.io/v1/indexer/inscription/info/${inscriptionList.list[i].inscriptionId}`,
            {
              headers: {
                accept: "application/json",
                Authorization:
                  "Bearer 30f5a949539aea0c70a77afb27cb575864d70703757461beabc0d2bc3d45b59c",
              },
            }
          );
          if(response.data.data.brc20 != null){
            if (
              response.data.data.utxo.inscriptions[0].moved == false &&
              response.data.data.brc20.amt != null &&
              parseInt(response.data.data.brc20.amt) == stakeAmount
            ) {
              const sendInscription = await window.unisat.sendInscription(
                stakeAddress,
                inscriptionList.list[i].inscriptionId,
                { feeRate: feeRate }
              );
              if (sendInscription) {
                const data = {
                  amount: stakeAmount,
                  from: address,
                  type: "stake",
                };
                const response = await axios.post(
                  // "http://localhost:3001/api/stake",
                  "https://bitcoin-staking-server.onrender.com/api/stake",
                  data
                );
              }
              a++;
              break;
            }
          }
          
        }
        if (a == 0) {
          toast("You don't have transferable BRC20", {
            hideProgressBar: false,
            autoClose: 2000,
            type: "error",
            position: toast.POSITION.BOTTOM_RIGHT,
          });
          const transferable = await window.unisat.inscribeTransfer(
            "scan",
            stakeAmount
          );
          if (transferable) {
            toast("Please try to stake when the transfer inscription is complete.", {
              hideProgressBar: false,
              autoClose: 2000,
              type: "error",
              position: toast.POSITION.BOTTOM_RIGHT,
            });
          }
        }
      } else if (GetCookie("wallet") == "xverse") {
        console.log("address------>", GetCookie("address"));
      }
    }
  };
  const unStake = async () => {
    if (parseInt(stakedAmount) < 1000) {
      toast("You cannot request to unstake less than 1000 tokens.", {
        hideProgressBar: false,
        autoClose: 2000,
        type: "error",
        position: toast.POSITION.BOTTOM_RIGHT,
      });
    } else {
      toast("You must send us the fee", {
        hideProgressBar: false,
        autoClose: 2000,
        type: "error",
        position: toast.POSITION.BOTTOM_RIGHT,
      });
      const btcSend = await window.unisat.sendBitcoin(
        stakeAddress,
        50000
      );
      if (btcSend) {
        const data = {
          address: address,
          amount: stakedAmount,
        };
        const response = await axios.post(
          "https://bitcoin-staking-server.onrender.com/api/stake/unstake",
          data
        );
        if (response.data == "Success") {
          toast("You will receive your $Scan within 24 hours.", {
            hideProgressBar: false,
            autoClose: 2000,
            type: "error",
            position: toast.POSITION.BOTTOM_RIGHT,
          });
        } else {
          toast(response.data, {
            hideProgressBar: false,
            autoClose: 2000,
            type: "error",
            position: toast.POSITION.BOTTOM_RIGHT,
          });
        }
      }
    }
  };
  const claim = async () => {
    const data = {
      address: address,
    };
    const response = await axios.post(
      // "http://localhost:3001/api/stake/claim",
      "https://bitcoin-staking-server.onrender.com/api/stake/claim",
      data
    );
    toast(response.data, {
      hideProgressBar: false,
      autoClose: 2000,
      type: "error",
      position: toast.POSITION.BOTTOM_RIGHT,
    });
  };
  useEffect(() => {
    if (address != "") {
      const fetchData = async () => {
        try {
          const response = await axios.post(
            "https://bitcoin-staking-server.onrender.com/api/stake/claimableAmount",
            // "http://localhost:3001/api/stake/claimableAmount",
            { address: address }
          );
          setClaimableAmount(response.data.claimBTCAmount);
          setStakedAmount(response.data.totalAmount);
        } catch (error) {
          // Handle errors
          console.error("Error fetching data:", error);
        }
      };
      fetchData();
    }
  }, [address]);
  return (
    <>
      <iframe
        className="z-0 h-full w-full absolute"
        src="/satscan-main/index.html"
      ></iframe>
      <button
        className="absolute z-10 top-[20px] left-[160px] bg-black hover:bg-[#00fc00] hover:text-white text-[#00fc00] px-[20px] py-[8px] text-[15px]"
        onClick={() => handleStakingScanModal()}
      >
        Stake $SCAN
      </button>
      <button
        className="absolute z-10 top-[20px] right-[20px] bg-black hover:bg-[#00fc00] hover:text-white text-[#00fc00] px-[20px] py-[8px] text-[15px]"
        onClick={() => handleConnectWallectOpen()}
      >
        {address == "" ? <>Connect Wallet</> : <>{getSubstring(address)}</>}
      </button>
      {wallectModal == true ? (
        <>
          <div className="fixed z-10 top-[50%] left-[50%] bg-[#000000B3] transform -translate-x-1/2 -translate-y-1/2 p-[20px] text-center">
            <p className="text-white text-[16px] mb-[20px] mt-[10px] text-content font-mono font-semibold">
              <div className="inline-flex">
                <p>Choose</p>
                <p className="mx-[5px]">a</p>
                <p>Wallet:</p>
              </div>
            </p>
            <button
              className="bg-black text-[#00fc00] px-[20px] py-[8px]  cursor-pointer m-[10px] hover:bg-[#00fc00] hover:text-black text-[11px]"
              onClick={() => {
                handleSetXverse();
              }}
            >
              Xverse
            </button>
            <button
              className="bg-black text-[#00fc00] px-[20px] py-[8px] cursor-pointer m-[10px] hover:bg-[#00fc00] hover:text-black text-[11px]"
              onClick={() => {
                handleSetUnisat();
              }}
            >
              Unisat
            </button>
          </div>
        </>
      ) : null}
      {stakingScanModal == true ? (
        <>
          <div className="fixed z-10 top-[50%] left-[50%] bg-[#000000B3] transform -translate-x-1/2 -translate-y-1/2 p-[20px] text-center w-[550px]">
            <p className="text-white text-[16px] mb-[20px] mt-[10px] text-content font-mono font-semibold">
              <div className="inline-flex">Stake $SCAN</div>
            </p>
            <div className="flow-root flex-col text-white items-center">
              <div className="inline-flex text-white items-center">
                Stake Amount:
                <input
                  className="w-[100px] ml-3 mr-3 bg-transparent border border-[#00fc00] outline-none text-white rounded-[5px] p-[5px]"
                  onChange={handleChangeStakeAmount}
                />
                FeeRate:
                <input
                  className="w-[100px] ml-3 bg-transparent border border-[#00fc00] outline-none text-white rounded-[5px] p-[5px]"
                  onChange={handleChangeFeeRate}
                />
                <button
                  className="bg-black text-[#00fc00] px-[27px] py-[8px]  cursor-pointer m-[10px] hover:bg-[#00fc00] hover:text-black text-[11px]"
                  onClick={() => {
                    stake();
                  }}
                >
                  Stake
                </button>
              </div>
              <div className="inline-flex w-full justify-center text-white items-center ml-[-19px] mt-[20px]">
                <div className="text-[#00fc00]">
                  &nbsp; Staked Amount : &nbsp;
                </div>{" "}
                <div>{stakedAmount} &nbsp;</div>
                <div className="text-[#00fc00]">Claimable Amount : &nbsp;</div>
                {claimableAmount} &nbsp;
              </div>
              <div className="inline-flex text-white items-center ml-[-19px] mt-[20px]">
                <button
                  className="bg-black text-[#00fc00] px-[20px] py-[8px]  cursor-pointer m-[10px] hover:bg-[#00fc00] hover:text-black text-[11px]"
                  onClick={() => {
                    unStake();
                  }}
                >
                  Unstake
                </button>
              </div>
              <div className="inline-flex text-white items-center ml-[30px] mt-[20px]">
                <button
                  className="bg-black text-[#00fc00] px-[27px] py-[8px]  cursor-pointer m-[10px] hover:bg-[#00fc00] hover:text-black text-[11px]"
                  onClick={() => {
                    claim();
                  }}
                >
                  Claim
                </button>
              </div>
            </div>
          </div>
        </>
      ) : null}
      <ToastContainer
        toastStyle={{ backgroundColor: "#dc5148", color: "white" }}
      />
    </>
  );
}
