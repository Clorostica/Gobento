export default function Footer() {
  return (
    <footer className="w-full flex items-center justify-center py-5 pb-6 mt-4">
      <p className="text-white/25 text-xs text-center">
        Created with{" "}
        <span className="text-pink-400">♥</span>
        {" "}by{" "}
        <a
          href="https://clorostica.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-violet-400 hover:text-violet-300 transition-colors font-semibold no-underline"
        >
          Clorostica
        </a>
      </p>
    </footer>
  );
}
