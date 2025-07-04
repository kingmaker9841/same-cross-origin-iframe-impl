import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  type IframeHTMLAttributes,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

interface MessageData {
  type: string;
  payload?: unknown;
  id?: string;
}

interface CustomIframeProps
  extends Omit<IframeHTMLAttributes<HTMLIFrameElement>, "onLoad" | "onError"> {
  ref?: React.Ref<CustomIframeRef>;
  children?: ReactNode;
  onLoad?: (iframe: HTMLIFrameElement) => void;
  onMessage?: (data: MessageData, origin: string) => void;
  onError?: (error: Error) => void;
  allowedOrigins?: string[];
  portalContent?: ReactNode;
  loadTimeout?: number;
}

export function CustomIframe({
  children,
  portalContent,
  onLoad,
  onMessage,
  onError,
  allowedOrigins = [],
  loadTimeout = 5000,
  ...props
}: CustomIframeProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCrossOrigin, setIsCrossOrigin] = useState(false);
  const loadTimeoutRef = useRef<number>(undefined);

  // Check if iframe is cross-origin
  const checkOrigin = useCallback((iframe: HTMLIFrameElement) => {
    try {
      // For iframes without src, they should be same-origin
      const doc = iframe.contentWindow?.document;
      if (doc) {
        setIsCrossOrigin(false);
        return false;
      }
    } catch (err: unknown) {
      console.error(err);
      setIsCrossOrigin(true);
      return true;
    }
    return true;
  }, []);

  // Handle iframe load
  const handleLoad = useCallback(() => {
    console.log("handleLoad called");
    const iframe = iframeRef.current;
    if (!iframe) {
      console.log("No iframe ref in handleLoad");
      return;
    }

    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }

    try {
      const isBlocked = checkOrigin(iframe);
      console.log("Cross-origin check result:", { isBlocked, src: iframe.src });

      if (!isBlocked) {
        const doc = iframe.contentWindow?.document;
        if (doc) {
          // For blank iframes, we might need to wait for the document to be ready
          if (doc.readyState === "loading") {
            console.log("Document still loading, waiting for DOMContentLoaded");
            doc.addEventListener("DOMContentLoaded", () => {
              console.log("DOMContentLoaded fired");
              setMountNode(doc.body);
            });
          } else {
            console.log("Document ready, setting mount node");
            setMountNode(doc.body);
          }
        }
      } else {
        // If cross-origin, we can't access the document, so no mount node
        console.log("Cross-origin detected, no mount node");
        setMountNode(null);
      }

      console.log("Setting isLoaded to true");
      setIsLoaded(true);
      onLoad?.(iframe);
    } catch (error) {
      console.error("Error in handleLoad:", error);
      const err =
        error instanceof Error ? error : new Error("Failed to load iframe");
      onError?.(err);
      setIsCrossOrigin(true);
      setMountNode(null); // Ensure mount node is null on error
    }
  }, [checkOrigin, onLoad, onError]);

  // Handle cross-origin messages
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      const iframe = iframeRef.current;
      if (!iframe) return;

      if (allowedOrigins.length > 0 && !allowedOrigins.includes(event.origin)) {
        console.warn(`Message from unauthorized origin: ${event.origin}`);
        return;
      }

      if (event.source !== iframe.contentWindow) {
        return;
      }

      try {
        const data: MessageData =
          typeof event.data === "string" ? JSON.parse(event.data) : event.data;

        onMessage?.(data, event.origin);
      } catch (error) {
        const err =
          error instanceof Error ? error : new Error("Failed to parse message");
        onError?.(err);
      }
    },
    [allowedOrigins, onMessage, onError]
  );

  // Set up message listener for cross-origin communication
  useEffect(() => {
    if (isCrossOrigin && onMessage) {
      window.addEventListener("message", handleMessage);
      return () => window.removeEventListener("message", handleMessage);
    }
  }, [isCrossOrigin, onMessage, handleMessage]);

  useEffect(() => {
    // Handle both blank iframes and add fallback for cross-origin iframes
    const iframe = iframeRef.current;
    if (!iframe) return;

    if (!props.src) {
      // Blank iframe - should be ready immediately
      console.log("Blank iframe detected, calling handleLoad");
      const timeoutId = setTimeout(() => {
        handleLoad();
      }, 0);

      return () => clearTimeout(timeoutId);
    } else {
      // For iframes with src, add a fallback timeout
      console.log("Iframe with src detected, setting up fallback");
      const fallbackTimeout = setTimeout(() => {
        console.log("Fallback timeout triggered, isLoaded:", isLoaded);
        if (!isLoaded) {
          console.log("Forcing load state for cross-origin iframe");
          setIsLoaded(true);
          setIsCrossOrigin(true);
          setMountNode(null);
          onLoad?.(iframe);
        }
      }, 2000); // 2 second fallback

      return () => clearTimeout(fallbackTimeout);
    }
  }, [props.src, handleLoad, isLoaded, onLoad]);

  useEffect(() => {
    // Only set timeout if there's a src attribute
    if (props.src) {
      loadTimeoutRef.current = setTimeout(() => {
        if (!isLoaded) {
          const error = new Error(
            `Iframe failed to load within ${loadTimeout}ms`
          );
          onError?.(error);
        }
      }, loadTimeout);

      return () => {
        if (loadTimeoutRef.current) {
          clearTimeout(loadTimeoutRef.current);
        }
      };
    }
  }, [props.src, isLoaded, loadTimeout, onError]);

  const sendMessage = useCallback(
    (data: MessageData, targetOrigin: string = "*") => {
      const iframe = iframeRef.current;
      if (!iframe) {
        console.warn("Iframe element not found");
        return;
      }

      if (!iframe.contentWindow) {
        console.warn("Iframe content window not available");
        return;
      }

      if (!isLoaded) {
        console.warn("Iframe not fully loaded yet");
        return;
      }

      try {
        const message = typeof data === "string" ? data : JSON.stringify(data);
        console.log("Sending message:", message, "to origin:", targetOrigin);
        iframe.contentWindow.postMessage(message, targetOrigin);
      } catch (error) {
        const err =
          error instanceof Error ? error : new Error("Failed to send message");
        console.error("Send message error:", err);
        onError?.(err);
      }
    },
    [isLoaded, onError]
  );

  React.useImperativeHandle(
    props.ref,
    () => {
      if (!iframeRef.current) {
        // Return a fallback object when iframe is not yet mounted
        return {
          sendMessage,
          isLoaded,
          isCrossOrigin,
          mountNode,
        } as CustomIframeRef;
      }

      return Object.assign(iframeRef.current, {
        sendMessage,
        isLoaded,
        isCrossOrigin,
        mountNode,
      });
    },
    [sendMessage, isLoaded, isCrossOrigin, mountNode]
  );

  console.log(isLoaded);

  return (
    <>
      <iframe ref={iframeRef} onLoad={handleLoad} {...props} />
      {/* Only create portal for same-origin iframes where we have DOM access */}
      {!isCrossOrigin &&
        mountNode &&
        (portalContent || children) &&
        createPortal(portalContent || children, mountNode)}

      {/* For cross-origin iframes, the content is already displayed via src */}
      {/* If you need to overlay content, render it outside the iframe */}
      {isCrossOrigin && (portalContent || children) && (
        <div style={{ position: "relative" }}>
          {/* This would render alongside/over the iframe, not inside it */}
          {portalContent || children}
        </div>
      )}
    </>
  );
}

export interface CustomIframeRef extends HTMLIFrameElement {
  sendMessage: (data: MessageData, targetOrigin?: string) => void;
  isLoaded: boolean;
  isCrossOrigin: boolean;
  mountNode: HTMLElement | null;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useIframeMessage(
  iframeRef: React.RefObject<CustomIframeRef>,
  _onMessage?: (data: MessageData, origin: string) => void
) {
  const sendMessage = useCallback(
    (data: MessageData, targetOrigin?: string) => {
      iframeRef.current?.sendMessage(data, targetOrigin);
    },
    [iframeRef]
  );

  return { sendMessage };
}
