import React, { useState, useEffect, useRef } from "react";

const SERVICE_UUID = "8f0d8818-7af1-4f6c-8a12-83b1fff3ce1b";
const CHARACTERISTIC_UUID = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";

function DevicePicker({ devices, onSelect, onCancel }) {
  return (
    <div className="min-h-screen w-full bg-gray-900 flex flex-col items-center justify-center text-white px-4">
      <div className="bg-gray-800 rounded-lg p-6 w-96 max-h-96 overflow-auto shadow-lg">
        <h2 className="text-xl mb-4 text-center font-semibold">
          Select BLE Device
        </h2>
        {devices.length === 0 ? (
          <p className="text-gray-400 text-center">Scanning for devices...</p>
        ) : (
          <ul className="divide-y divide-gray-700 max-h-72 overflow-auto">
            {devices.map((device) => (
              <li
                key={device.id}
                onClick={() => onSelect(device)}
                className="cursor-pointer px-4 py-2 hover:bg-blue-700 rounded"
                title={device.name || "Unnamed device"}
              >
                {device.name || "Unnamed device"}
              </li>
            ))}
          </ul>
        )}
        <div className="flex justify-center mt-6">
          <button onClick={onCancel} className="btn-cancel">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function Notification({ type, message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-gray-900 text-white rounded-lg p-6 shadow-xl max-w-sm w-full relative z-50">
        <p className="mb-4 text-center">{message}</p>
        <div className="flex justify-center space-x-4">
          {onCancel && (
            <button
              onClick={onCancel}
              className="rounded-lg border border-transparent px-6 py-2 bg-gray-800 hover:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-600"
            >
              Cancel
            </button>
          )}
          <button
            onClick={onConfirm}
            className="rounded-lg px-6 py-2 bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-600"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [device, setDevice] = useState(null);
  const [connected, setConnected] = useState(false);
  const [fields, setFields] = useState({
    fullName: "",
    occupation: "",
    email: "",
    phone: "",
    qr: "",
  });
  const [showForm, setShowForm] = useState(false);
  const [status, setStatus] = useState("Idle");

  // BLE scanning & devices
  const [isScanning, setIsScanning] = useState(false);
  const [availableDevices, setAvailableDevices] = useState([]);
  const scanRef = useRef(null);

  // Notifications
  const [notification, setNotification] = useState(null);

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault(); // Prevent automatic prompt
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === "accepted") {
      console.log("PWA install accepted");
    } else {
      console.log("PWA install dismissed");
    }
    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

  // Handle scanning via requestLEScan API
  const startScan = async () => {
    if (!navigator.bluetooth) {
      const ua = navigator.userAgent.toLowerCase();
      const isBrave = ua.includes("brave");
      const isChrome = ua.includes("chrome") && !isBrave;
      const isEdge = ua.includes("edg/");

      const baseFlagsLink = isBrave
        ? "brave://flags"
        : isChrome
        ? "chrome://flags"
        : isEdge
        ? "edge://flags"
        : null;

      setNotification({
        type: "error",
        message: (
          <div>
            <p className="mb-2">
              Web Bluetooth is only supported on Chromium-based browsers like
              Chrome, Edge, and Brave on desktop.
            </p>
            <p className="mb-4">
              If you are using one of these browsers and still can't use Web
              Bluetooth, you may need to enable certain experimental features
              (flags). Please open your browser’s flags page and search for{" "}
              <strong>“bluetooth”</strong>. Enable the following flags:
            </p>
            <ul className="list-disc list-inside mb-4">
              <li>
                <strong>Web Bluetooth API</strong>: Gives websites access to
                Bluetooth devices.
              </li>
              <li>
                <strong>Web Bluetooth</strong>: Enables the API on unsupported
                platforms like Linux.
              </li>
              <li>
                <strong>Web Bluetooth New Permissions Backend</strong>: Stores
                permissions and enables advanced features.
              </li>
              <li>
                <strong>Web Bluetooth Confirm Pairing Support</strong>: Enables
                pairing confirmation dialogs.
              </li>
            </ul>
            {baseFlagsLink && (
              <div className="text-center mt-4">
                <a
                  href={baseFlagsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                >
                  Open Flags Page
                </a>
                <p className="text-sm text-gray-400 mt-2">
                  If the button doesn't work, copy and paste this URL into your
                  browser's address bar:
                </p>
                <div className="mt-2 bg-gray-800 text-white px-3 py-2 rounded select-all break-words text-sm">
                  {baseFlagsLink}
                </div>
              </div>
            )}
            <p className="mt-4">
              After enabling, please restart your browser and try again.
            </p>
          </div>
        ),
        onConfirm: () => setNotification(null),
      });

      return;
    }

    try {
      const isAvailable = await navigator.bluetooth.getAvailability?.();

      if (isAvailable === false) {
        // Detect browser for flags link
        const ua = navigator.userAgent.toLowerCase();
        const isBrave = ua.includes("brave");
        const isChrome = ua.includes("chrome") && !isBrave;

        const flagsLink = isBrave
          ? "brave://flags/#brave-web-bluetooth-api"
          : isChrome
          ? "chrome://flags/#enable-web-bluetooth"
          : null;

        const learnMoreButton = flagsLink
          ? () => window.open(flagsLink, "_blank", "noopener noreferrer")
          : null;

        setNotification({
          type: "error",
          message: (
            <>
              <p className="mb-2 text-center">
                Bluetooth appears to be turned off or unavailable.
              </p>
              <p className="text-sm text-center text-gray-300">
                Please turn on Bluetooth and ensure that Web Bluetooth is
                enabled in your browser settings.
              </p>
              {flagsLink && (
                <div className="mt-4 flex justify-center">
                  <button
                    onClick={learnMoreButton}
                    className="rounded px-4 py-2 bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Open Flags Page
                  </button>
                </div>
              )}
            </>
          ),
          onConfirm: () => setNotification(null),
        });
        return;
      }
    } catch (e) {
      console.warn("Could not determine Bluetooth availability", e);
    }

    if (!navigator.bluetooth.requestLEScan) {
      // fallback to default requestDevice dialog
      requestDeviceAndConnect();
      return;
    }

    setAvailableDevices([]);
    setIsScanning(true);
    setStatus("Scanning for devices...");

    try {
      const scan = await navigator.bluetooth.requestLEScan({
        filters: [{ services: [SERVICE_UUID] }],
        keepRepeatedDevices: false,
      });

      scanRef.current = scan;

      navigator.bluetooth.addEventListener("advertisementreceived", (event) => {
        setAvailableDevices((prevDevices) => {
          if (prevDevices.some((d) => d.id === event.device.id))
            return prevDevices;
          return [...prevDevices, event.device];
        });
      });

      // Auto-stop scan after 15s
      setTimeout(() => {
        stopScan();
      }, 15000);
    } catch (err) {
      if (err?.message?.includes("cancelled")) {
        // Silent cancel
        setStatus("Idle");
        return;
      }

      setNotification({
        type: "error",
        message: "Scan failed: " + err.message,
        onConfirm: () => setNotification(null),
      });
      setIsScanning(false);
      setStatus("Idle");
    }
  };

  const stopScan = () => {
    if (scanRef.current) {
      scanRef.current.stop();
      scanRef.current = null;
    }
    setIsScanning(false);
    setStatus("Idle");
  };

  const cancelScan = () => {
    stopScan();
  };

  const selectDevice = async (selectedDevice) => {
    stopScan();
    setIsScanning(false);

    try {
      setStatus(`Connecting to ${selectedDevice.name || "Unnamed device"}...`);
      const server = await selectedDevice.gatt.connect();
      await server.getPrimaryService(SERVICE_UUID);
      setDevice(selectedDevice);
      setConnected(true);
      setShowForm(true);
      setStatus("Connected");
    } catch (err) {
      if (err.message === "User cancelled the requestDevice() chooser.") {
        // User cancelled - silently ignore
        setStatus("Idle");
        // Optionally just close the modal or reset scanning UI:
        setAvailableDevices([]);
        setIsScanning(false);
        return;
      }
      setNotification({
        type: "error",
        message: "Failed to connect: " + err.message,
        onConfirm: () => setNotification(null),
      });
      setStatus("Idle");
    }
  };

  // Fallback: requestDevice with browser default picker
  const requestDeviceAndConnect = async () => {
    if (!navigator.bluetooth) {
      setNotification({
        type: "error",
        message:
          "Web Bluetooth not supported in this browser. Use Chrome desktop.",
        onConfirm: () => setNotification(null),
      });
      return;
    }

    try {
      setStatus("Requesting device...");
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [SERVICE_UUID] }],
      });
      setStatus(`Connecting to ${device.name || "Unnamed device"}...`);
      const server = await device.gatt.connect();
      await server.getPrimaryService(SERVICE_UUID);
      setDevice(device);
      setConnected(true);
      setShowForm(true);
      setStatus("Connected");
    } catch (error) {
      if (error.message === "User cancelled the requestDevice() chooser.") {
        // User cancelled, ignore silently
        setStatus("Idle");
        return;
      }
      setNotification({
        type: "error",
        message: "Failed to connect: " + error.message,
        onConfirm: () => setNotification(null),
      });
      setStatus("Idle");
    }
  };

  const handleChange = (field, value) => {
    setFields((prev) => ({ ...prev, [field]: value }));
  };

  const validateInputs = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const urlRegex = /^https:\/\/[\w.-]+\.[a-z]{2,}(\/[\w\/.-]*)?$/i;

    return (
      fields.fullName.trim() !== "" &&
      fields.occupation.trim() !== "" &&
      emailRegex.test(fields.email) &&
      fields.phone.trim() !== "" &&
      urlRegex.test(fields.qr)
    );
  };

  const extractDomainLabel = (url) => {
    try {
      const u = new URL(url);
      const hostname = u.hostname;
      const domain = hostname.split(".")[0];
      return domain.charAt(0).toUpperCase() + domain.slice(1);
    } catch {
      return "Scan me";
    }
  };

  const confirmAndSend = async () => {
    if (!validateInputs()) {
      setNotification({
        type: "error",
        message: "Please fill all fields correctly.",
        onConfirm: () => setNotification(null),
      });
      return;
    }

    setNotification({
      type: "confirm",
      message: "Are you sure you want to send the data?",
      onConfirm: async () => {
        setNotification(null);
        try {
          const server = await device.gatt.connect();
          const service = await server.getPrimaryService(SERVICE_UUID);
          const characteristic = await service.getCharacteristic(
            CHARACTERISTIC_UUID
          );

          const domainLabel = extractDomainLabel(fields.qr);
          const fullString = [
            fields.fullName,
            fields.occupation,
            fields.email,
            fields.phone,
            fields.qr,
            domainLabel,
          ].join("|");

          const encoder = new TextEncoder();
          await characteristic.writeValue(encoder.encode(fullString));

          setNotification({
            type: "success",
            message: "Data sent successfully!",
            onConfirm: () => setNotification(null),
          });

          setFields({
            fullName: "",
            occupation: "",
            email: "",
            phone: "",
            qr: "",
          });
        } catch (err) {
          setNotification({
            type: "error",
            message: "Failed to send data.",
            onConfirm: () => setNotification(null),
          });
        }
      },
      onCancel: () => setNotification(null),
    });
  };

  return (
    <>
      <div className="flex justify-center pt-20 pb-2">
        <img
          src="../public/logo.png"
          alt="Ink! Logo"
          className="w-40 h-40 rounded-full shadow-lg border border-gray-300 bg-white"
        />
      </div>
      <div className="min-h-screen w-full flex flex-col items-center justify-center text-white">
        {!showForm ? (
          <>
            <p className="text-lg mb-6">
              {status === "Idle"
                ? "🔍 Click to scan for nearby devices"
                : status}
            </p>
            {!connected && (
              <button onClick={startScan} disabled={isScanning || connected}>
                {isScanning ? "Scanning..." : "Connect to Device"}
              </button>
            )}
          </>
        ) : (
          <main className="w-full max-w-4xl bg-gray-800 p-8 rounded-lg shadow-lg mx-4">
            <h1 className="text-4xl font-bold mb-8 text-center">Ink!</h1>
            <div>
              <label className="block mb-1 font-semibold" htmlFor="fullName">
                Full Name
              </label>
              <input
                className="mb-4 p-3 border rounded-md w-full bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Full Name"
                value={fields.fullName}
                onChange={(e) => handleChange("fullName", e.target.value)}
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold" htmlFor="occupation">
                Occupation
              </label>
              <input
                className="mb-4 p-3 border rounded-md w-full bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Occupation / Job / Student"
                value={fields.occupation}
                onChange={(e) => handleChange("occupation", e.target.value)}
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold" htmlFor="email">
                Email Address
              </label>
              <input
                className="mb-4 p-3 border rounded-md w-full bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                type="email"
                placeholder="Email Address"
                value={fields.email}
                onChange={(e) => handleChange("email", e.target.value)}
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold" htmlFor="phone">
                Phone Number
              </label>
              <input
                className="mb-4 p-3 border rounded-md w-full bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Phone Number"
                value={fields.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold" htmlFor="qr">
                QRCode (Personal Page, Github, LinkedIn, Email Address)
              </label>
              <div className="flex w-full mb-4">
                <span className="pr-4 text-gray-400 select-none flex-shrink-0 flex items-center">
                  https://
                </span>
                <input
                  className="flex-grow p-3 border rounded-r-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="yourpage.com"
                  value={fields.qr.replace(/^https?:\/\//, "")}
                  onChange={(e) =>
                    handleChange(
                      "qr",
                      "https://" + e.target.value.replace(/^https?:\/\//, "")
                    )
                  }
                />
              </div>
            </div>
            <button onClick={confirmAndSend} className="btn-send">
              Send
            </button>
          </main>
        )}

        {/* Device picker modal */}
        {isScanning && !showForm && (
          <DevicePicker
            devices={availableDevices}
            onSelect={selectDevice}
            onCancel={cancelScan}
          />
        )}

        {/* Notifications */}
        {notification && (
          <Notification
            type={notification.type}
            message={notification.message}
            onConfirm={notification.onConfirm}
            onCancel={notification.onCancel}
          />
        )}
        {deferredPrompt && (
          <button
            onClick={handleInstallClick}
            className="fixed bottom-4 right-4 px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-600"
          >
            Install App
          </button>
        )}
      </div>
    </>
  );
}
