/* PUNKED — panel de Tweaks (controles expresivos) */
const PUNKED_DEFAULTS = /*EDITMODE-BEGIN*/{
  "layout": "collage",
  "mood": "papel",
  "grain": 18
}/*EDITMODE-END*/;

function PunkedTweaks(){
  const [t, setTweak] = useTweaks(PUNKED_DEFAULTS);

  React.useEffect(()=>{
    const run = ()=>{
      if(!window.PUNKED) return false;
      window.PUNKED.applyMood(t.mood);
      window.PUNKED.applyLayout(t.layout);
      window.PUNKED.applyGrain(t.grain);
      return true;
    };
    if(!run()){
      const id = setInterval(()=>{ if(run()) clearInterval(id); }, 120);
      return ()=>clearInterval(id);
    }
  }, [t.layout, t.mood, t.grain]);

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Composición" />
      <TweakRadio label="Disposición" value={t.layout}
                  options={['ordenada','collage','caos']}
                  onChange={(v)=>setTweak('layout', v)} />
      <TweakSection label="Atmósfera" />
      <TweakRadio label="Mood" value={t.mood}
                  options={['papel','xerox','neon']}
                  onChange={(v)=>setTweak('mood', v)} />
      <TweakSlider label="Grano fotocopia" value={t.grain} min={0} max={100} step={1} unit="%"
                   onChange={(v)=>setTweak('grain', v)} />
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById('tweak-root')).render(<PunkedTweaks/>);
