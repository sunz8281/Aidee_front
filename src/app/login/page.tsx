'use client'

export default function LoginPage() {
  const handleGoogleLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/oauth2/authorization/google`
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="bg-card border border-card-border rounded-[16px] px-12 py-14 flex flex-col items-center w-[400px]">
        <h1 className="text-[28px] font-bold text-title mb-2 tracking-[-0.5px]">Aidee</h1>
        <p className="text-base text-text-tertiary mb-10">AI 에이전트형 프로젝트 관리 서비스</p>

        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 h-[52px] rounded-[10px] border border-card-border bg-white hover:bg-gray-50 transition-colors cursor-pointer text-[15px] font-medium text-[#3c4043]"
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            <path fill="none" d="M0 0h48v48H0z"/>
          </svg>
          Google로 로그인
        </button>
      </div>
    </div>
  )
}
