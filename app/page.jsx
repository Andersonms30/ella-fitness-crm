"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

// ============================================================
// FITNESS CRM — SaaS com Supabase Realtime
// Substitua as constantes abaixo com suas credenciais Supabase
// ============================================================

// ── CONFIGURE AQUI ────────────────────────────────────────────
const SUPABASE_URL = "https://sxwjyvpqsprwthyqtjzy.supabase.co";
const SUPABASE_KEY = "sb_publishable_j6F1AdpN9B9OUNBUXoFmOA_R-Sjh_Wn";
// ─────────────────────────────────────────────────────────────

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Design Tokens ─────────────────────────────────────────────
const G = {
  bg:"#07070f", surf:"#0f0f1a", card:"#13131f", bord:"#ffffff0d", bord2:"#ffffff16",
  pink:"#f472b6", rose:"#fb7185", violet:"#a78bfa", purple:"#7c3aed",
  green:"#34d399", amber:"#fbbf24", red:"#f87171", sky:"#38bdf8",
  muted:"#ffffff38", sub:"#ffffff65", text:"#f5f5ff"
};
const PAL = [G.pink,G.violet,G.green,G.amber,G.rose,G.sky,"#fb923c","#a3e635"];
const METHODS = { pix:"PIX", debit:"Débito", credit:"Crédito", crediario:"Crediário" };
const MC = { pix:G.green, debit:G.amber, credit:G.violet, crediario:G.rose };

// ── Utils ─────────────────────────────────────────────────────
const R    = v => `R$ ${Number(v||0).toFixed(2).replace(".",",")}`;
const pct  = (a,b) => b ? ((a/b)*100).toFixed(1)+"%" : "—";
const TODAY= () => new Date().toISOString().slice(0,10);
const INI  = s => (s||"?").trim().split(/\s+/).map(w=>w[0]).join("").slice(0,2).toUpperCase();
const fmtD = d => d ? new Date(d+"T12:00:00").toLocaleDateString("pt-BR") : "—";
const fmtMonth = d => d ? new Date(d+"T12:00:00").toLocaleDateString("pt-BR",{month:"short",year:"numeric"}) : "";
const addMonths = (dateStr, n) => {
  const d = new Date(dateStr+"T12:00:00"); d.setMonth(d.getMonth()+n); return d.toISOString().slice(0,10);
};
const dueDateDay = (refDate, monthOffset, day) => {
  const d = new Date(refDate+"T12:00:00");
  d.setMonth(d.getMonth()+monthOffset);
  d.setDate(parseInt(day)||10);
  return d.toISOString().slice(0,10);
};

// ── Primitives ────────────────────────────────────────────────
const Card = ({children,style,onClick}) => (
  
