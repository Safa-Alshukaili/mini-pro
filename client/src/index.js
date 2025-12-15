// client/src/index.js
import "bootstrap/dist/css/bootstrap.min.css";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
//import { store } from "./Store/store";
import { Provider } from "react-redux";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  /*<Provider store={store}>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </Provider>*/
  <App />
);
