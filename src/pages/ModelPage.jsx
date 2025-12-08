
import React,{useEffect,useState} from 'react'
import { useParams } from 'react-router-dom'

export default function ModelPage(){
  const { slug } = useParams()
  const [model,setModel]=useState(null)
  const [videos,setVideos]=useState([])

  useEffect(()=>{
    fetch('/api/models/'+slug).then(r=>r.json()).then(setModel)
    fetch('/api/models/'+slug+'/videos').then(r=>r.json()).then(setVideos)
  },[slug])

  if(!model) return <p>Loading...</p>

  return (
    <div style={{padding:40,color:'white',background:'#111'}}>
      <h1>{model.display_name}</h1>
      <p>{model.bio}</p>

      <a href={'/gateway/'+slug} style={{color:'red'}}>Full Episodes (18+)</a>

      <h2>SFW Previews</h2>
      {videos.map(v=>(
        <div key={v.id}>
          <img src={v.thumbnail_url} width="200"/>
          <p>{v.title}</p>
        </div>
      ))}
    </div>
  )
}
