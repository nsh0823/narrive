import {
  BarChart2,
  Brain,
  Database,
  FileText,
  Newspaper,
  Shield,
  TrendingUp,
  Zap
} from "lucide-react";

export const SYMBOLS = [
  {
    symbol: "NVDA",
    name: "NVIDIA Corporation",
    type: "Stock",
    price: 207.41,
    changePercent: -2.37,
    volume: "125.1M",
    marketCap: "$5.06T",
    score: 82,
    color: "#76B900"
  },
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    type: "Stock",
    price: 189.25,
    changePercent: -0.8,
    volume: "58.3M",
    marketCap: "$2.93T",
    score: 68,
    color: "#475569"
  },
  {
    symbol: "MSFT",
    name: "Microsoft Corporation",
    type: "Stock",
    price: 415.3,
    changePercent: 1.2,
    volume: "21.7M",
    marketCap: "$3.09T",
    score: 74,
    color: "#2563EB"
  },
  {
    symbol: "TSLA",
    name: "Tesla, Inc.",
    type: "Stock",
    price: 242.1,
    changePercent: -3.09,
    volume: "98.4M",
    marketCap: "$771B",
    score: 54,
    color: "#DC2626"
  },
  {
    symbol: "AMD",
    name: "Advanced Micro Devices",
    type: "Stock",
    price: 168.9,
    changePercent: 1.8,
    volume: "35.6M",
    marketCap: "$273B",
    score: 76,
    color: "#EF4444"
  },
  {
    symbol: "GOOGL",
    name: "Alphabet Inc.",
    type: "Stock",
    price: 175.8,
    changePercent: 0.9,
    volume: "24.2M",
    marketCap: "$2.18T",
    score: 70,
    color: "#4285F4"
  },
  {
    symbol: "META",
    name: "Meta Platforms, Inc.",
    type: "Stock",
    price: 506.8,
    changePercent: 1.69,
    volume: "19.1M",
    marketCap: "$1.29T",
    score: 73,
    color: "#0866FF"
  },
  {
    symbol: "AMZN",
    name: "Amazon.com, Inc.",
    type: "Stock",
    price: 184.6,
    changePercent: 0.72,
    volume: "31.4M",
    marketCap: "$1.92T",
    score: 71,
    color: "#0F172A"
  },
  {
    symbol: "SPY",
    name: "SPDR S&P 500 ETF Trust",
    type: "ETF",
    price: 522.1,
    changePercent: 0.4,
    volume: "71.8M",
    marketCap: "$491B",
    score: 65,
    color: "#0891B2"
  },
  {
    symbol: "QQQ",
    name: "Invesco QQQ Trust",
    type: "ETF",
    price: 449.35,
    changePercent: 0.88,
    volume: "42.6M",
    marketCap: "$219B",
    score: 69,
    color: "#7C3AED"
  }
] as const;

export const SUPPORTED_SYMBOLS = SYMBOLS.map((item) => item.symbol);

export const ANALYSIS_TYPES = [
  {
    value: "long_term",
    label: "Long-term investment",
    description: "Durable fundamentals, themes, and long horizon risk.",
    icon: TrendingUp
  },
  {
    value: "short_term",
    label: "Short-term opportunity",
    description: "Momentum, technical setup, and near-term catalysts.",
    icon: Zap
  },
  {
    value: "news",
    label: "Market news analysis",
    description: "Recent headlines, sentiment, and theme clustering.",
    icon: Newspaper
  },
  {
    value: "risk",
    label: "Risk assessment",
    description: "Downside drivers, volatility, and evidence quality.",
    icon: Shield
  }
] as const;

export const ANALYSIS_TYPE_LABELS = Object.fromEntries(
  ANALYSIS_TYPES.map((type) => [type.value, type.label])
) as Record<(typeof ANALYSIS_TYPES)[number]["value"], string>;

export const TIME_HORIZONS = [
  { value: "1w", label: "1 Week" },
  { value: "1m", label: "1 Month" },
  { value: "3m", label: "3 Months" },
  { value: "1y", label: "1 Year" }
] as const;

export const TIME_HORIZON_LABELS = Object.fromEntries(
  TIME_HORIZONS.map((horizon) => [horizon.value, horizon.label])
) as Record<(typeof TIME_HORIZONS)[number]["value"], string>;

export const MARKET_INDICES = [
  { label: "S&P 500", value: "5,487.03", change: "+0.31%" },
  { label: "NASDAQ", value: "17,862.23", change: "+0.74%" },
  { label: "VIX", value: "12.88", change: "-1.52%" }
];

export const GENERATION_STEPS = [
  { label: "Market Data Collection", icon: Database },
  { label: "Technical Indicator Calculation", icon: BarChart2 },
  { label: "News Aggregation", icon: Newspaper },
  { label: "AI Analysis", icon: Brain },
  { label: "Report Generation", icon: FileText }
] as const;
