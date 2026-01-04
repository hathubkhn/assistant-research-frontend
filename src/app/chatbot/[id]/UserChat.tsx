import Image from "next/image";

const UserChat = ({ data, image, name }: any) => {
  return (
    <div className="py-8">
      <div className="flex gap-3 items-center py-1">
        <Image
          src={
            image || "/vpbank1.png"
          }
          alt="avartar"
          width={32}
          height={32}
          className="h-8 w-8 rounded-md object-cover"
        />
        <span className="font-semibold py-3">{name}</span>
      </div>
      <p className="px-11">{data.text}</p>
    </div>
  );
};

export default UserChat;
