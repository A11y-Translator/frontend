import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './panel.css'
import PopupApp from './PopupApp'

document.documentElement.style.cssText = 'width:400px;height:600px;overflow:hidden'
document.body.style.cssText = 'width:400px;height:600px;margin:0;overflow:hidden'
document.getElementById('root')!.style.height = '100%'
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PopupApp />
  </StrictMode>,
)
