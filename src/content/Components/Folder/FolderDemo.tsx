import Folder from './Folder'

function FolderDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center overflow-hidden bg-gray-950">
      <Folder
        label="Projects"
        color="#3d8bff"
        tabPosition="right"
        items={[{ title: 'Brand guidelines' }, { title: 'Launch plan' }, { title: 'Moodboard' }]}
      />
    </div>
  )
}

export default FolderDemo
