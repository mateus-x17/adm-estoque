import { useEffect, useState } from "react";
import { productsApi, suppliersApi, categoriesApi, movementsApi } from "../services/api";

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
                const movements = await movementsApi.getMovements();
                setMovementsData(movements);

                // Fluxo de mercadorias
                const products = [...new Set(movements.map((m) => m.produto.nome))];

                const formattedChart = products.map((produto) => {
                    const entradas = movements
                        .filter((m) => m.produto.nome === produto && m.tipo === "ENTRADA")
                        .reduce((acc, cur) => acc + cur.quantidade, 0);

                    const saidas = movements
                        .filter((m) => m.produto.nome === produto && m.tipo === "SAIDA")
                        .reduce((acc, cur) => acc + cur.quantidade, 0);

                    return { produto, Entradas: entradas, Saidas: saidas };
                });

                setChartData(formattedChart);

                // Montante de saídas por data
                const saidas = movements.filter((m) => m.tipo === "SAIDA");

                const porData = saidas.reduce((acc, mov) => {
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
