"use client";

import dynamic from "next/dynamic";

const FloatingActions = dynamic(() => import("./FloatingActions"), {
  ssr: false,
});

export default function ClientFloatingActions() {
  return <FloatingActions />;
}