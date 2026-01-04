import Image from "next/image";
import Markdown from "markdown-to-jsx";

const BotChat = ({ data }: any) => {
  return (
    <div className="py-8">
      <div className="flex py-1 justify-between">
        <div className="flex gap-3 items-center">
          <Image
            src={"/robot.png"}
            alt="avartar"
            width={32}
            height={32}
            className="h-8 w-8 rounded-md object-cover"
          />
          <span className="font-semibold py-3">Duyên</span>
        </div>
      </div>
      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <Markdown
          options={{
            forceBlock: true,
            overrides: {
              table: {
                component: "table",
                props: {
                  className:
                    "table-auto w-full border-collapse my-4 text-sm border border-gray-300 dark:border-gray-700",
                },
              },
              thead: {
                component: "thead",
                props: {
                  className:
                    "bg-gray-100 dark:bg-gray-800 font-semibold text-gray-800 dark:text-gray-200",
                },
              },
              th: {
                component: "th",
                props: {
                  className:
                    "border border-gray-300 dark:border-gray-700 px-3 py-2 text-left",
                },
              },
              td: {
                component: "td",
                props: {
                  className:
                    "border border-gray-300 dark:border-gray-700 px-3 py-2 align-top",
                },
              },
              h1: {
                component: "h1",
                props: { className: "text-3xl font-bold mt-6 mb-4" },
              },
              h2: {
                component: "h2",
                props: { className: "text-2xl font-semibold mt-5 mb-3" },
              },
              h3: {
                component: "h3",
                props: { className: "text-xl font-semibold mt-4 mb-2" },
              },
              p: {
                component: "p",
                props: { className: "my-3 leading-relaxed" },
              },
              a: {
                component: "a",
                props: {
                  className:
                    "text-blue-600 dark:text-blue-400 hover:underline font-medium",
                  target: "_blank",
                  rel: "noopener noreferrer",
                },
              },
              ul: {
                component: "ul",
                props: { className: "list-disc pl-6 my-3" },
              },
              ol: {
                component: "ol",
                props: { className: "list-decimal pl-6 my-3" },
              },
              li: {
                component: "li",
                props: { className: "mb-1" },
              },
              blockquote: {
                component: "blockquote",
                props: {
                  className:
                    "border-l-4 border-gray-400 dark:border-gray-600 pl-4 italic my-4 text-gray-700 dark:text-gray-300",
                },
              },
              code: {
                component: "code",
                props: {
                  className:
                    "bg-gray-100 dark:bg-gray-800 rounded px-1 py-0.5 text-sm font-mono text-pink-600 dark:text-pink-400",
                },
              },
              pre: {
                component: (props: any) => (
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4 text-sm font-mono">
                    {props.children}
                  </pre>
                ),
              },
              hr: {
                component: "hr",
                props: { className: "my-6 border-gray-300 dark:border-gray-700" },
              },
              img: {
                component: "img",
                props: { className: "rounded-lg my-3" },
              },
            },
          }}
        >
          {data.text}
        </Markdown>
      </div>
    </div>
  );
};

export default BotChat;
