import { useEffect, useState } from "react";
import { productsApi, suppliersApi, categoriesApi, movementsApi } from "../services/api/index.js";

export const useDashboardData = () => {
    const [loading, setLoading] = useState(true);

    const [stats, setStats] = useState({
        totalProdutos: 0,
        lowStock: 0,
        totalValue: 0,
        lowStockList: [],
    });

    const [totalFornecedores, setTotalFornecedores] = useState(0);
    const [totalCategorias, setTotalCategorias] = useState(0);
    const [movementsData, setMovementsData] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [userStats, setUserStats] = useState([]);
    const [saidaMontanteData, setSaidaMontanteData] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

            try {
                // KPIs
                const [statsData, fornData, catData] = await Promise.all([
                    productsApi.getProductStats(),
                    suppliersApi.getSuppliersCount(),
                    categoriesApi.getCategoriesCount(),
                ]);

                setStats({
                    totalProdutos: statsData.total,
                    lowStock: statsData.lowStock,
                    totalValue: statsData.totalValue,
                    lowStockList: statsData.lowStockList,
                });

                setTotalFornecedores(fornData.count);
                setTotalCategorias(catData.count);

                // Movements
                const movementsRes = await movementsApi.getMovements({ limit: "all" });
                const movements = Array.isArray(movementsRes) ? movementsRes : (movementsRes?.data || []);
                setMovementsData(movements);

                // Fluxo de mercadorias
                const products = [...new Set(movements.map((m) => m.produto.nome))];

                const formattedChart = products.map((produto) => {
                    const reposicoes = movements
                        .filter((m) => m.produto.nome === produto && (m.tipo === "REPOSICAO" || m.tipo === "ENTRADA"))
                        .reduce((acc, cur) => acc + cur.quantidade, 0);

                    const vendas = movements
                        .filter((m) => m.produto.nome === produto && (m.tipo === "VENDA" || m.tipo === "SAIDA"))
                        .reduce((acc, cur) => acc + cur.quantidade, 0);

                    return {
                        produto,
                        Vendas: vendas,
                        Reposicoes: reposicoes,
                        Entradas: reposicoes,
                        Saidas: vendas,
                    };
                });

                setChartData(formattedChart);

                // Montante de vendas por data
                const vendas = movements.filter((m) => m.tipo === "VENDA" || m.tipo === "SAIDA");

                const porData = vendas.reduce((acc, mov) => {
                    const data = new Date(mov.data).toLocaleDateString("pt-BR");

                    if (!acc[data]) acc[data] = { data, montante: 0 };

                    acc[data].montante += mov.quantidade * Number(mov.produto.preco);

                    return acc;
                }, {});

                const sorted = Object.values(porData).sort((a, b) => {
                    const [da, ma, ya] = a.data.split("/");
                    const [db, mb, yb] = b.data.split("/");
                    return new Date(ya, ma - 1, da) - new Date(yb, mb - 1, db);
                });

                setSaidaMontanteData(sorted);

                // User stats
                const userData = await movementsApi.getUserStats();
                setUserStats(userData);
            } catch (err) {
                console.error("Erro no dashboard:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return {
        loading,
        stats,
        totalFornecedores,
        totalCategorias,
        movementsData,
        chartData,
        userStats,
        saidaMontanteData,
    };
};
