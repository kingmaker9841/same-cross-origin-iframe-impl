import "./index.css";

import { useEffect, useId, useRef, useState } from "react";

import { CustomIframe } from "./CustomIframe";
import { Form } from "./Form";

interface MessageData {
  type: string;
  payload?: unknown;
  id?: string;
}

interface CustomIframeRef extends HTMLIFrameElement {
  sendMessage: (data: MessageData, targetOrigin?: string) => void;
  isLoaded: boolean;
  isCrossOrigin: boolean;
  mountNode: HTMLElement | null;
}

function IdentityCheck({ iframeRef }: { iframeRef: HTMLIFrameElement | null }) {
  if (!iframeRef?.contentWindow) return null;

  const sameArray = window.Array === iframeRef.contentWindow.Array;
  const sameWindow = window === iframeRef.contentWindow;

  return (
    <div className="debug-panel">
      <p>Array constructor equal: {String(sameArray)}</p>
      <p>Window object equal: {String(sameWindow)}</p>
    </div>
  );
}

function App() {
  const [formData, setFormData] = useState({ name: "", email: "" });
  const crossOriginIframRef = useRef<CustomIframeRef>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    // ...submit logic
  };

  const handleCrossOriginPostMessage = (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    const coI = crossOriginIframRef.current;
    if (!coI) return;
    const id = Date.now().toString();
    coI.sendMessage({ type: "handleSubmit", payload: {}, id });
  };

  const handlePrefillFrom = () => {
    const coI = crossOriginIframRef.current;
    if (!coI) return;
    const id = Date.now().toString();
    coI.sendMessage({
      type: "handleSubmit",
      payload: {
        name: "John",
        email: "john@john.john",
      },
      id,
    });
  };

  const handleClearForm = () => {
    const coI = crossOriginIframRef.current;
    if (!coI) return;
    const id = Date.now().toString();
    coI.sendMessage({
      type: "handleSubmit",
      payload: {
        name: "",
        email: "",
      },
      id,
    });
  };

  useEffect(() => {
    const coI = crossOriginIframRef.current;
    console.log("here2312");
    if (!coI) return;

    window.addEventListener("message", (event) => {
      //If its not expected, its unauthorized origin
      if (event.origin !== "http://localhost:8000") {
        return;
      }

      const msgType = typeof event.data;
      let msg;
      if (msgType === "string") {
        // do sth with string
      } else {
        msg = JSON.parse(event.data) as MessageData;
        switch (msg.type) {
          case "formSubmitted":
            console.log("Message from Server received: formSubmitted");
            break;
          case "formValidationError":
            console.error("Form validation failed:", event.data.payload.error);
            break;
          case "formCleared":
            console.log("Form was cleared");
            break;
        }
      }
    });
  }, [crossOriginIframRef]);

  return (
    <main>
      <h2>Same and Cross Origin Policy for Iframe</h2>
      <hr />
      <br />
      <br />
      {/* ******* Same Origin with children *********** */}
      <div className="w-full h-auto bg-gray-300">
        <h3>Same Origin without src / Document Loaded inside</h3>
        <CustomIframe
          width={"100%"}
          height={"100%"}
          portalContent={
            <Form
              onChangeHandler={handleChange}
              onSubmitHandler={handleSubmit}
            />
          }
        />
        <button
          className="border border-gray-900 cursor-pointer"
          onClick={handleSubmit}
        >
          Submit from Parent
        </button>
      </div>
      <hr />
      <br />
      <br />
      {/* ******* Same Origin with SRC *********** */}
      <br />
      <br />
      <div className="w-full h-auto bg-green-200">
        <h3>Same Origin with Src</h3>
        <CustomIframe
          src={import.meta.env.VITE_REACT_URL}
          width={"100%"}
          height={"100%"}
          style={{ border: "none" }}
        />
      </div>
      <hr />
      <br />
      <br />

      {/* ******* Same Origin with SRC *********** */}
      <br />
      <br />
      <div className="w-full h-auto bg-red-200">
        <h3>Cross Origin with src</h3>
        <CustomIframe
          src={"http://localhost:8000/index.html"}
          width={"100%"}
          height={"100%"}
          style={{ border: "none" }}
          allowedOrigins={["http://localhost:8000"]}
          ref={crossOriginIframRef}
          onLoad={() => {
            console.log("Iframe loaded successfully!");
          }}
        />
        {/* Requires post message communication */}

        <button
          onClick={handleCrossOriginPostMessage}
          className="border border-gray-900 cursor-pointer flex rounded-sm px-4 py-2 bg-amber-300"
        >
          Submit Form from Parent
        </button>
        <button
          onClick={handlePrefillFrom}
          className="border border-gray-900 cursor-pointer flex rounded-sm px-4 py-2 mt-2 bg-amber-800 text-white"
        >
          Prefill Form from Parent
        </button>
        <button
          onClick={handleClearForm}
          className="border border-gray-900 cursor-pointer rounded-sm px-4 py-2 mt-2 bg-green-200"
        >
          Clear Form from Parent
        </button>
      </div>
      <br />
      <br />
    </main>
  );
}

export default App;
