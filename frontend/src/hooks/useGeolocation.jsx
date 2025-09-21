// Lightweight hook that wraps navigator.geolocation with status
import { useState } from 'react'


export default function useGeolocation() {
const [coords, setCoords] = useState(null)
const [status, setStatus] = useState('idle')


function capture(options = { timeout: 15000 }) {
if (!navigator.geolocation) { setStatus('unsupported'); return }
setStatus('pending')
navigator.geolocation.getCurrentPosition(pos => {
setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude, acc: pos.coords.accuracy })
setStatus('captured')
}, err => {
setStatus('failed')
}, options)
}


return { coords, status, capture }
}