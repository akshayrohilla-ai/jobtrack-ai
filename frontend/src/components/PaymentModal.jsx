import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../App'
import { trackEvent } from '../lib/analytics'

const PACKS = [
  { id: 'pack_10', credits: 10, amount_inr: 199, label: '10 Credits', per: '₹19.9 / credit', popular: false },
  { id: 'pack_30', credits: 30, amount_inr: 499, label: '30 Credits', per: '₹16.6 / credit', popular: true },
]

export default function PaymentModal({ onClose, onSuccess }) {
  const { setCreditBalance } = useAuth()
  const [selected, setSelected] = useState('pack_30')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Load Razorpay checkout script
    if (!window.Razorpay) {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      document.body.appendChild(script)
    }
  }, [])

  async function handleBuy() {
    setLoading(true)
    setError('')
    try {
      const { data: order } = await api.post('/api/payments/create-order', { pack_id: selected })

      const options = {
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: 'JobTrack AI',
        description: PACKS.find(p => p.id === selected)?.label,
        order_id: order.order_id,
        handler: async (response) => {
          try {
            const { data } = await api.post('/api/payments/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              pack_id: selected,
            })
            // Revenue analytics — attributed to the identified user.
            const boughtPack = PACKS.find(p => p.id === selected)
            trackEvent('credit_purchased', {
              pack_id: selected,
              credits: boughtPack?.credits,
              amount_inr: boughtPack?.amount_inr,
              new_balance: data.balance,
            })
            setCreditBalance(data.balance)
            onSuccess?.(data)
            onClose()
          } catch {
            setError('Payment verified but credit top-up failed. Contact support.')
          }
        },
        modal: { ondismiss: () => setLoading(false) },
        theme: { color: '#1B6FEB' },
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', () => {
        setError('Payment failed. Please try again.')
        setLoading(false)
      })
      rzp.open()
    } catch (e) {
      setError(e.response?.data?.detail || 'Could not initiate payment. Try again.')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-2xl p-6"
        style={{ background: 'var(--navy-800)', border: '1px solid rgba(255,255,255,0.1)' }}>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-white font-semibold text-lg">Top up credits</h2>
            <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Credits never expire. Use for evaluations & CV tailoring.
            </p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
            style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>
            ✕
          </button>
        </div>

        {/* Packs */}
        <div className="flex flex-col gap-3 mb-6">
          {PACKS.map(pack => (
            <button key={pack.id} onClick={() => setSelected(pack.id)}
              className="relative w-full rounded-xl p-4 text-left transition-all"
              style={{
                background: selected === pack.id ? 'rgba(27,111,235,0.15)' : 'rgba(255,255,255,0.04)',
                border: selected === pack.id ? '1.5px solid var(--blue-accent)' : '1.5px solid rgba(255,255,255,0.08)',
              }}>
              {pack.popular && (
                <span className="absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: 'rgba(27,111,235,0.3)', color: 'var(--blue-light)' }}>
                  Best value
                </span>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-semibold">{pack.label}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{pack.per}</div>
                </div>
                <div className="text-right">
                  <div className="text-white font-bold text-lg">₹{pack.amount_inr}</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg text-sm"
            style={{ background: 'rgba(220,53,69,0.15)', color: '#ff6b7a', border: '1px solid rgba(220,53,69,0.3)' }}>
            {error}
          </div>
        )}

        <button onClick={handleBuy} disabled={loading}
          className="w-full py-3 rounded-xl font-semibold text-sm transition-all"
          style={{
            background: loading ? 'rgba(27,111,235,0.5)' : 'var(--blue-accent)',
            color: 'white',
            opacity: loading ? 0.7 : 1,
          }}>
          {loading ? 'Opening payment…' : `Pay ₹${PACKS.find(p => p.id === selected)?.amount_inr}`}
        </button>

        <p className="text-center text-xs mt-3" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Secured by Razorpay · UPI, cards, netbanking accepted
        </p>
      </div>
    </div>
  )
}
