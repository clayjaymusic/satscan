import React from "react";
import "tailwindcss/tailwind.css";
import "../components/basic.scss";
function MyApp({ Component, pageProps }) {

  return (
    <>
      {/* {loading ? <Loader /> : null} */}
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
