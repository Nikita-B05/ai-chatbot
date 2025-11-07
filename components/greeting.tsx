"use client";

import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { guestRegex } from "@/lib/constants";

const getUserName = (email: string | null | undefined): string => {
  if (!email) {
    return "One Day";
  }
  
  // If it's a guest user, default to "One Day Broker"
  if (guestRegex.test(email)) {
    return "One Day";
  }
  
  // Extract name from email (part before @)
  const emailName = email.split("@")[0];
  
  // Capitalize first letter of each word
  const formattedName = emailName
    .split(/[._-]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
  
  return formattedName || "One Day";
};

export const Greeting = () => {
  const { data: session } = useSession();
  const userName = getUserName(session?.user?.email ?? null);

  return (
    <div
      className="mx-auto mt-4 flex size-full max-w-3xl flex-col justify-center px-4 md:mt-16 md:px-8"
      key="overview"
    >
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="font-semibold text-xl md:text-2xl"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.5 }}
      >
        Hey there, {userName} 👋
      </motion.div>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="text-xl text-zinc-500 md:text-2xl"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.6 }}
      >
        How can I help you today?
      </motion.div>
    </div>
  );
};
