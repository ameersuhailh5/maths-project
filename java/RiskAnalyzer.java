package com.yieldrisk;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * YieldRisk - Quantitative Stock Volatility & Interest Rate Risk Analyzer (Java Edition)
 */
public class RiskAnalyzer {

    public static class StockPricePoint {
        public String date;
        public double price;
        public double interestRate;

        public StockPricePoint(String date, double price, double interestRate) {
            this.date = date;
            this.price = price;
            this.interestRate = interestRate;
        }
    }

    public static class RiskMetrics {
        public double volatility30d;
        public double volatility1y;
        public double maxDrawdown;
        public double var95Daily;
        public double rateBeta;
        public double durationProxy;
        public double sharpeRatio;
        public String overallRiskLevel;
        public boolean isVolatilityAlert;
        public String alertMessage;
    }

    public static RiskMetrics calculateRiskMetrics(List<StockPricePoint> history, double thresholdPercent) {
        RiskMetrics metrics = new RiskMetrics();
        if (history == null || history.size() < 5) {
            return metrics;
        }

        List<Double> dailyReturns = new ArrayList<>();
        List<Double> rateChanges = new ArrayList<>();

        for (int i = 1; i < history.size(); i++) {
            double prev = history.get(i - 1).price;
            double curr = history.get(i).price;
            if (prev > 0) {
                dailyReturns.add((curr - prev) / prev);
            }
            double rateDiff = (history.get(i).interestRate - history.get(i - 1).interestRate) * 100.0;
            rateChanges.add(rateDiff);
        }

        int N = dailyReturns.size();
        if (N == 0) return metrics;

        // Volatilities
        metrics.volatility30d = calculateVol(dailyReturns.subList(Math.max(0, N - 30), N));
        metrics.volatility1y = calculateVol(dailyReturns);

        // Max Drawdown
        double peak = history.get(0).price;
        double maxDd = 0.0;
        for (StockPricePoint pt : history) {
            if (pt.price > peak) {
                peak = pt.price;
            } else {
                double dd = (peak - pt.price) / peak;
                if (dd > maxDd) {
                    maxDd = dd;
                }
            }
        }
        metrics.maxDrawdown = maxDd;

        // VaR 95%
        List<Double> sorted = new ArrayList<>(dailyReturns);
        Collections.sort(sorted);
        int idx95 = Math.max(0, (int) (N * 0.05));
        metrics.var95Daily = Math.abs(sorted.get(idx95));

        // Rate Beta
        double meanRet = dailyReturns.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
        double meanRate = rateChanges.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);

        double cov = 0.0, varRate = 0.0;
        for (int i = 0; i < N; i++) {
            cov += (dailyReturns.get(i) - meanRet) * (rateChanges.get(i) - meanRate);
            varRate += Math.pow(rateChanges.get(i) - meanRate, 2);
        }

        metrics.rateBeta = varRate > 0 ? (cov / varRate) * 100.0 : -0.18;
        metrics.durationProxy = Math.abs(metrics.rateBeta * 2.5);

        double annualReturn = Math.pow(1.0 + meanRet, 252.0) - 1.0;
        metrics.sharpeRatio = metrics.volatility1y > 0 ? (annualReturn - 0.0425) / metrics.volatility1y : 0.0;
        metrics.overallRiskLevel = (metrics.volatility1y * 100.0 > 25.0) ? "High" : "Moderate";

        // Check Volatility Threshold Trigger
        double shortVolPct = metrics.volatility30d * 100.0;
        if (shortVolPct >= thresholdPercent) {
            metrics.isVolatilityAlert = true;
            metrics.alertMessage = String.format("ALERT: 30-Day Volatility (%.2f%%) exceeds defined threshold (%.2f%%).",
                    shortVolPct, thresholdPercent);
        }

        return metrics;
    }

    private static double calculateVol(List<Double> returns) {
        if (returns.size() < 2) return 0.15;
        double mean = returns.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
        double sumSq = 0.0;
        for (double r : returns) {
            sumSq += Math.pow(r - mean, 2);
        }
        double variance = sumSq / (returns.size() - 1);
        return Math.sqrt(variance * 252.0);
    }

    public static void main(String[] args) {
        String symbol = args.length > 0 ? args[0] : "AAPL";
        double threshold = args.length > 1 ? Double.parseDouble(args[1]) : 25.0;

        System.out.println("=== YieldRisk Java Engine Analysis for " + symbol + " ===");
        System.out.printf("Volatility Threshold: %.2f%%\n\n", threshold);

        List<StockPricePoint> history = new ArrayList<>();
        double p = 150.0;
        double r = 4.10;
        for (int i = 0; i < 252; i++) {
            p *= (1.0 + (Math.random() - 0.5) * 0.03);
            r += (Math.random() - 0.5) * 0.02;
            history.add(new StockPricePoint("Day-" + i, p, r));
        }

        RiskMetrics metrics = calculateRiskMetrics(history, threshold);

        System.out.printf("Current Price:           $%.2f\n", history.get(history.size() - 1).price);
        System.out.printf("30-Day Volatility (HV):   %.2f%%\n", metrics.volatility30d * 100);
        System.out.printf("1-Year Volatility (HV):   %.2f%%\n", metrics.volatility1y * 100);
        System.out.printf("Max Drawdown:            -%.2f%%\n", metrics.maxDrawdown * 100);
        System.out.printf("95%% Daily VaR:           -%.2f%%\n", metrics.var95Daily * 100);
        System.out.printf("Duration Proxy:          %.2f years\n", metrics.durationProxy);

        if (metrics.isVolatilityAlert) {
            System.out.println("\n[!] VOLATILITY THRESHOLD TRIGGERED: " + metrics.alertMessage);
        } else {
            System.out.println("\n[OK] Volatility within defined risk limit.");
        }
    }
}
