import React, { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { useThemeStore } from "../../store/useThemeStore.js"
import { useUserStore } from "../../store/userStore.js"
import { useAuthStore } from "../../store/useAuthStore.js"
import ModalMensagem from "../common/ModalMensagem.jsx"

const formConfigs = {
  usuario: {
    fields: [
      { name: "nome", label: "Nome", type: "text", required: true },
      { name: "email", label: "Email", type: "email", required: true },
      { name: "role", label: "Função", type: "select", options: ["ADMIN", "GERENTE", "OPERADOR"], required: true },
      { name: "imagem", label: "Foto do Usuário", type: "file" },
    ],
    route: (id) => `http://localhost:5000/users/${id}`,
  },
  CriarUsuario: {
    fields: [
      { name: "nome", label: "Nome", type: "text", required: true },
      { name: "email", label: "Email", type: "email", required: true },
      { name: "senha", label: "Senha", type: "password", required: true },
      { name: "role", label: "Função", type: "select", options: ["ADMIN", "GERENTE", "OPERADOR"], required: true },
      { name: "imagem", label: "Foto do Usuário", type: "file" },
    ],
    route: "http://localhost:5000/users",
  },
  produto: {
    fields: [
      { name: "nome", label: "Nome", type: "text", required: true },
      { name: "preco", label: "Preço", type: "number", required: true },
      { name: "quantidade", label: "Quantidade", type: "number", required: true },
      { name: "descricao", label: "Descrição", type: "textarea" },
      { name: "categoriaId", label: "Categoria", type: "select", endpoint: "/categories", keyName: "categoria" },
      { name: "fornecedorId", label: "Fornecedor", type: "select", endpoint: "/suppliers", keyName: "fornecedores" },
      { name: "imagem", label: "Imagem do Produto", type: "file" },
    ],
    route: (id) => `http://localhost:5000/products/${id}`,
  },
  CriarProduto: {
    fields: [
      { name: "nome", label: "Nome", type: "text", required: true },
      { name: "preco", label: "Preço", type: "number", required: true },
      { name: "quantidade", label: "Quantidade", type: "number", required: true },
      { name: "descricao", label: "Descrição", type: "textarea" },
      { name: "categoriaId", label: "Categoria", type: "select", endpoint: "/categories", keyName: "categoria" },
      { name: "fornecedorId", label: "Fornecedor", type: "select", endpoint: "/suppliers", keyName: "fornecedores" },
      { name: "imagem", label: "Imagem do Produto", type: "file" },
    ],
    route: "http://localhost:5000/products",
  },
  fornecedor: {
    fields: [
      { name: "nome", label: "Nome", type: "text", required: true },
      { name: "email", label: "Email", type: "email", required: true },
      { name: "telefone", label: "Telefone", type: "text", required: true },
      { name: "endereco", label: "Endereço", type: "text", required: true },
    ],
    route: (id) => `http://localhost:5000/suppliers/${id}`,
  },
  CriarFornecedor: {
    fields: [
      { name: "nome", label: "Nome", type: "text", required: true },
      { name: "email", label: "Email", type: "email", required: true },
      { name: "telefone", label: "Telefone", type: "text", required: true },
      { name: "endereco", label: "Endereço", type: "text", required: true },
    ],
    route: "http://localhost:5000/suppliers",
  },
  CriarPedido: {
    fields: [
      { name: "produtoId", label: "Produto", type: "select", endpoint: "/products", keyName: "data", required: true },
      { name: "quantidade", label: "Quantidade", type: "number", required: true },
      { name: "tipo", label: "Tipo", type: "select", options: ["SAIDA", "ENTRADA"], required: true },
      { name: "observacao", label: "Observação", type: "textarea" },
    ],
    // Special route handling for this one
    dynamicRoute: (formData) => `http://localhost:5000/products/${formData.produtoId}/adjust`,
  }
}

function EditarItem({ type = "usuario", itemData, onClose, onItemUpdated }) {
  const { darkMode } = useThemeStore()
  const token = useAuthStore((state) => state.token)
  const config = formConfigs[type]
  const isCreating = type.startsWith("Criar")

  const [form, setForm] = useState(
    config.fields.reduce((acc, field) => {
      acc[field.name] = itemData?.[field.name] || ""
      return acc
    }, {})
  )

  const [file, setFile] = useState(null)
  const [modal, setModal] = useState({ visible: false, mensagem: "", tipo: "" })
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const [selectOptions, setSelectOptions] = useState({})

  useEffect(() => {
    config.fields.forEach(async (field) => {
      if (field.type !== "select") return

      if (field.endpoint) {
        const res = await fetch(`http://localhost:5000${field.endpoint}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (!res.ok) return
        const data = await res.json()
        /////
        console.log("PRODUCTS RESPONSE", data)
        /////
        const list = Array.isArray(data) ? data : data[field.keyName] || []
        setSelectOptions((prev) => ({ ...prev, [field.name]: list }))
      } else if (field.options) {
        setSelectOptions((prev) => ({
          ...prev,
          [field.name]: field.options.map((opt) => ({ id: opt, nome: opt })),
        }))
      }
    })
  }, [token])

  useEffect(() => {
    setTimeout(() => setOpen(true), 10)
  }, [])

  const handleClose = () => {
    setOpen(false)
    setClosing(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    console.log("TOKEN", token)

    try {
      const formData = new FormData()
      Object.entries(form).forEach(([key, value]) => formData.append(key, value))
      if (file) formData.append("imagem", file)

      const method = isCreating ? "POST" : "PUT"
      let url = isCreating ? config.route : config.route(itemData.id)

      if (config.dynamicRoute) {
        url = config.dynamicRoute(form)
      }

      // Special body handling for adjust-quantity which expects JSON, not FormData usually, 
      // but the original code used FormData for everything. 
      // The original Pedidos.jsx used JSON. Let's send JSON if it's adjust-quantity or if no file is present? 
      // Actually, existing backend likely handles FormData for products/users (w/ images). 
      // adjust-quantity might expect JSON. Let's check Pedidos.jsx again in thought. 
      // Pedidos.jsx uses JSON.stringify.
      // Let's force JSON for CriarPedido or if no file.
      const hasFileField = config.fields.some(
        (field) => field.type === "file"
      )
    let body
    const headers = {}

    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    if (type === "CriarPedido") {
      headers["Content-Type"] = "application/json"

      const payload = {
        ...form,
        quantidade: Number(form.quantidade),
      }

      body = JSON.stringify(payload)

    } else if (hasFileField) {

      body = formData

    } else {

      headers["Content-Type"] = "application/json"
      body = JSON.stringify(form)

    }

      console.log("FORM:", form)
      for (const pair of formData.entries()) {
        console.log(pair[0], pair[1])
      }

      const res = await fetch(url, {
        method,
        headers,
        body,
      })

      console.log("STATUS:", res.status)
      const responseText = await res.clone().text()
      console.log("RESPONSE:", responseText)

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))

        console.error("BACKEND ERROR:", err)

        setModal({
          visible: true,
          mensagem:
            err.error ||
            err.message ||
            `Erro ${res.status}`,
          tipo: "erro",
        })

        return
      }

      // const updatedItem = isCreating
      //   ? await res.json()
      //   : await fetch(config.route(itemData.id), {
      //     headers: token ? { Authorization: `Bearer ${token}` } : {},
      //   }).then((r) => r.json())

      // const updatedItem = await res.json()
      const responseData = await res.json()
      const updatedItem =
        responseData.fornecedor ||
        responseData.produto ||
        responseData.usuario ||
        responseData

      setModal({
        visible: true,
        mensagem: `${type.replace("Criar", "")} ${isCreating ? "criado" : "atualizado"} com sucesso`,
        tipo: "sucesso",
      })

      setTimeout(() => {
        setModal({ visible: false })
        handleClose()
        onItemUpdated && onItemUpdated(updatedItem)
      }, 2000)
    } catch {
      setModal({ visible: true, mensagem: "Erro de conexão", tipo: "erro" })
    }
  }

  return createPortal(
    <div
      className={`fixed inset-0 z-50 bg-black/60 transition-opacity ${closing ? "opacity-0" : "opacity-100"}`}
      onClick={handleClose}
      onTransitionEnd={() => closing && onClose()}
    >
      <div
        className={`absolute right-0 top-0 h-screen w-full max-w-md transform transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"
          } bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-2xl flex flex-col rounded-l-3xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {isCreating ? `Criar ${type.replace("Criar", "")}` : `Editar ${type}`}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-6 space-y-4">
          {config.fields.map((field) => (
            <div key={field.name}>
              <label className="block text-sm mb-1 text-gray-600 dark:text-gray-400">
                {field.label}
              </label>

              {field.type === "select" ? (
                <select
                  name={field.name}
                  value={form[field.name]}
                  onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                  className="w-full rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                >
                  <option value="">Selecione</option>
                  {selectOptions[field.name]?.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.nome}
                    </option>
                  ))}
                </select>
              ) : field.type === "textarea" ? (
                <textarea
                  name={field.name}
                  rows={3}
                  value={form[field.name]}
                  onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                  className="w-full rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm resize-none text-gray-900 dark:text-gray-100"
                />
              ) : field.type === "file" ? (
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="w-full rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                />
              ) : (
                <input
                  type={field.type}
                  name={field.name}
                  value={form[field.name]}
                  onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                  className="w-full rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                />
              )}
            </div>
          ))}
        </form>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm rounded-lg bg-gray-200 dark:bg-gray-700"
          >
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
          >
            Salvar
          </button>
        </div>

        {modal.visible && (
          <ModalMensagem
            mensagem={modal.mensagem}
            tipo={modal.tipo}
            onClose={() => setModal({ visible: false })}
          />
        )}
      </div>
    </div>,
    document.body
  )
}

export default EditarItem
