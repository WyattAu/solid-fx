import ElasticMesh from './ElasticMesh'

function ElasticMeshDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center bg-neutral-950">
      <div class="h-72 w-full max-w-xl">
        <ElasticMesh text="Squish" color="#8b5cf6" material="balloon" />
      </div>
    </div>
  )
}

export default ElasticMeshDemo
