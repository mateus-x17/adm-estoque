import React, { useEffect, useState } from "react"
import { useUserStore } from "../store/userStore"
import MovimentacaoRow from "../components/MovimentacaoRow"
import ModalMovimentacao from "../components/ModalMovimentacao"
import { FiFilter } from "react-icons/fi"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

const Movimentacoes = () => {
  const url = "http://localhost:5000/movements"
  const { token } = useUserStore()

  const [movimentacoes, setMovimentacoes] = useState([])
  const [loaded, setLoaded] = useState(false)

  // filtros
  const [search, setSearch] = useState("")
  const [tipoFiltro, setTipoFiltro] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [filtrosAbertos, setFiltrosAbertos] = useState(true)

  // paginação
  const [paginaAtual, setPaginaAtual] = useState(1)
  const itensPorPagina = 8

  // modal
  const [modalAberto, setModalAberto] = useState(false)
  const [movSelecionada, setMovSelecionada] = useState(null)

  // gráficos
  const [lineChartData, setLineChartData] = useState([])
  const [pieChartData, setPieChartData] = useState([])

  const pieColors = ["#22c55e", "#ef4444"]

  const abrirModal = (mov) => {
    setMovSelecionada(mov)
    setModalAberto(true)
  }

  useEffect(() => {
    const fetchAll = async () => {
      const res = await fetch(url, {
        headers: { authorization: `Bearer ${token}` },
      })
      const data = await res.json()

      setMovimentacoes(data)
      setLoaded(true)

      const grouped = {}
      let entradas = 0
      let saidas = 0

      data.forEach((m) => {
        const date = new Date(m.data).toLocaleDateString("pt-BR")

        if (!grouped[date]) {
          grouped[date] = { date, Entradas: 0, Saidas: 0 }
        }

        if (m.tipo === "ENTRADA") {
          grouped[date].Entradas += m.quantidade
          entradas += m.quantidade
        } else {
          grouped[date].Saidas += m.quantidade
          saidas += m.quantidade
        }
      })

      setLineChartData(Object.values(grouped))
      setPieChartData([
        { name: "Entradas", value: entradas },
        { name: "Saídas", value: saidas },
      ])
    }

    fetchAll()
  }, [token])

  // filtros aplicados
  const filtradas = movimentacoes
    .filter((m) =>
      m.produto.nome.toLowerCase().includes(search.toLowerCase())
    )
    .filter((m) => (tipoFiltro ? m.tipo === tipoFiltro : true))
    .filter((m) => {
      const data = new Date(m.data)
      if (fromDate && data < new Date(fromDate)) return false
      if (toDate && data > new Date(toDate)) return false
      return true
    })

  const totalPaginas = Math.ceil(filtradas.length / itensPorPagina)

  const paginadas = filtradas.slice(
    (paginaAtual - 1) * itensPorPagina,
    paginaAtual * itensPorPagina
  )

  return (
    <div className="w-full min-h-screen pt-6 pb-12 px-4 md:px-8 max-w-7xl mx-auto space-y-8">
      {/* header */}
      <header>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
          Movimentações
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Controle de entradas e saídas de produtos
        </p>
      </header>

      {/* filtros colapsáveis */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 rounded-3xl">
        <button
          onClick={() => setFiltrosAbertos(!filtrosAbertos)}
          className="w-full px-6 py-4 flex items-center justify-between font-semibold"
        >
          <span className="text-sm text-slate-900 dark:text-white"> Filtros</span>
          <span className="text-sm text-slate-500">
            {filtrosAbertos ? "Ocultar" : "Mostrar"}
          </span>
        </button>

        {filtrosAbertos && (
          <div className="p-6 pt-0 flex flex-col lg:flex-row gap-4">
            <input
              type="text"
              placeholder="Buscar produto"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full lg:w-1/3 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <select
              value={tipoFiltro}
              onChange={(e) => setTipoFiltro(e.target.value)}
              className="w-full lg:w-48 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              <option value="ENTRADA">Entrada</option>
              <option value="SAIDA">Saída</option>
            </select>

            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full lg:w-48 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full lg:w-48 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm text-slate-900 dark:text-white"
            />
          </div>
        )}
      </section>

      {/* tabela */}
      <div className="bg-white dark:bg-slate-900 border rounded-3xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100">
            <tr>
              <th className="px-4 py-3 text-left">Produto</th>
              <th className="hidden md:table-cell px-4 py-3 text-center">
                Tipo
              </th>
              <th className="hidden md:table-cell px-4 py-3 text-center">
                Qtd
              </th>
              <th className="hidden md:table-cell px-4 py-3">Usuário</th>
              <th className="hidden md:table-cell px-4 py-3">Data</th>
              <th className="md:hidden px-4 py-3 text-center">Ações</th>
            </tr>
          </thead>

          <tbody>
            {loaded &&
              paginadas.map((mov, i) => (
                <MovimentacaoRow
                  key={mov.id}
                  movimentacao={mov}
                  index={i}
                  abrirModal={abrirModal}
                />
              ))}
          </tbody>
        </table>
      </div>

      {/* paginação */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            disabled={paginaAtual === 1}
            onClick={() => setPaginaAtual(p => p - 1)}
            className="px-4 py-2 rounded-xl text-sm bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white disabled:opacity-40"
          >
            Anterior
          </button>

          <span className="text-sm text-slate-600 dark:text-slate-400">
            Página {paginaAtual} de {totalPaginas}
          </span>

          <button
            disabled={paginaAtual === totalPaginas}
            onClick={() => setPaginaAtual(p => p + 1)}
            className="px-4 py-2 rounded-xl text-sm bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white disabled:opacity-40"
          >
            Próximo
          </button>
        </div>
      )}

      {/* gráficos */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border rounded-3xl p-6">
          <h3 className="font-semibold mb-4 text-slate-900 dark:text-white">Entradas x Saídas</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={lineChartData}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Entradas" stroke="#22c55e" />
              <Line type="monotone" dataKey="Saidas" stroke="#ef4444" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-slate-900 border rounded-3xl p-6">
          <h3 className="font-semibold mb-4 text-slate-900 dark:text-white">Resumo geral</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={pieChartData}
                dataKey="value"
                nameKey="name"
                outerRadius={90}
                label
              >
                {pieChartData.map((_, i) => (
                  <Cell key={i} fill={pieColors[i]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>


      <ModalMovimentacao
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        movimentacao={movSelecionada}
      />
    </div>
  )
}

export default Movimentacoes;
