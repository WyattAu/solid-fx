import ProfileCard from './ProfileCard'

function ProfileCardDemo() {
  return (
    <div class="flex h-96 w-full items-center justify-center rounded-xl bg-neutral-900">
      <ProfileCard
        avatarUrl="https://picsum.photos/seed/profilecard/400/500"
        miniAvatarUrl="https://picsum.photos/seed/profilecard-mini/80/80"
        iconUrl="https://picsum.photos/seed/profilecard-icon/240/240"
        name="Javi A. Torres"
        title="Software Engineer"
        handle="javicodes"
        status="Online"
        contactText="Contact"
      />
    </div>
  )
}

export default ProfileCardDemo
