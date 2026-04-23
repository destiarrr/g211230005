import { useCallback, useEffect, useState } from "react";
import { BrowserProvider } from "ethers";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on?: (event: string, cb: (...args: unknown[]) => void) => void;
      removeListener?: (event: string, cb: (...args: unknown[]) => void) => void;
      isMetaMask?: boolean;
    };
  }
}

export function useWallet() {
  const { user } = useAuth();
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  // Load saved wallet from profile
  useEffect(() => {
    if (!user) {
      setAddress(null);
      return;
    }
    void supabase
      .from("profiles")
      .select("wallet_address")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.wallet_address) setAddress(data.wallet_address);
      });
  }, [user]);

  // Listen for account changes
  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;
    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = args[0] as string[];
      if (accounts.length === 0) setAddress(null);
      else setAddress(accounts[0]);
    };
    const handleChainChanged = (...args: unknown[]) => {
      setChainId(args[0] as string);
    };
    window.ethereum.on?.("accountsChanged", handleAccountsChanged);
    window.ethereum.on?.("chainChanged", handleChainChanged);
    return () => {
      window.ethereum?.removeListener?.("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener?.("chainChanged", handleChainChanged);
    };
  }, []);

  const connect = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      toast.error("MetaMask tidak terdeteksi", {
        description: "Silakan install ekstensi MetaMask terlebih dahulu.",
        action: {
          label: "Install",
          onClick: () => window.open("https://metamask.io/download/", "_blank"),
        },
      });
      return null;
    }
    setConnecting(true);
    try {
      const provider = new BrowserProvider(window.ethereum as never);
      const accounts = await provider.send("eth_requestAccounts", []);
      const network = await provider.getNetwork();
      const addr = accounts[0] as string;
      setAddress(addr);
      setChainId(`0x${network.chainId.toString(16)}`);

      // Save to profile if logged in
      if (user) {
        await supabase
          .from("profiles")
          .update({ wallet_address: addr })
          .eq("user_id", user.id);
        toast.success("Wallet terhubung", {
          description: `${addr.slice(0, 6)}...${addr.slice(-4)} tersimpan ke profil.`,
        });
      } else {
        toast.success("Wallet terhubung");
      }
      return addr;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal connect wallet";
      toast.error(msg);
      return null;
    } finally {
      setConnecting(false);
    }
  }, [user]);

  const disconnect = useCallback(async () => {
    setAddress(null);
    if (user) {
      await supabase
        .from("profiles")
        .update({ wallet_address: null })
        .eq("user_id", user.id);
    }
    toast.info("Wallet diputus");
  }, [user]);

  return { address, chainId, connecting, connect, disconnect };
}

export function shortAddr(addr: string | null): string {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}
