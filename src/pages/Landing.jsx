
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

export default function Landing() {
  const [models, setModels] = useState([])

  useEffect(()=>{
    fetch('/api/models?featured=true')
      .then(r=>r.json()).then(setModels)
  },[])

  return (
    <div style={{padding:40,color:'white',background:'#111'}}>
      <h1>Hot Challenges Hub</h1>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:20}}>
        {models.map(m=>(
          <Link key={m.id} to={`/website/${m.slug}`} style={{color:'white'}}>
            <img src={m.safe_thumbnail_url||m.avatar_url} width="100%"/>
            <h3>{m.display_name}</h3>
          </Link>
        ))}
      </div>
    </div>
  )
}
