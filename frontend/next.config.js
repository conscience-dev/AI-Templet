/** @type {import('next').NextConfig} */
const nextConfig = {
  // 정적 파일 최적화
  output: "standalone",

  // 빌드 시 CSS 안정성 확보
  compiler: {
    styledComponents: false,
  },
};

module.exports = nextConfig;
