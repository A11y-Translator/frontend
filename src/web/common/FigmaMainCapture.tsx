// Figma 828:2730 · 검사 화면의 예시 사이트. 실제 검사에는 screenshotUrl을 사용한다.
import imgI from '@/shared/assets/figma/capture-imgI.svg'
import imgI1 from '@/shared/assets/figma/capture-imgI1.svg'
import imgIconImage from '@/shared/assets/figma/capture-imgIconImage.svg'
import imgI2 from '@/shared/assets/figma/capture-imgI2.svg'
import imgIconImage1 from '@/shared/assets/figma/capture-imgIconImage1.svg'
import imgIconImage2 from '@/shared/assets/figma/capture-imgIconImage2.svg'
import imgIconImage3 from '@/shared/assets/figma/capture-imgIconImage3.svg'

export function FigmaMainCapture() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <div
        style={{
          width: 880,
          height: 752,
          transform: 'scale(0.8340909091)',
          transformOrigin: 'top left',
        }}
      >
        <div className="bg-white border-[#eeeff1] border-[0.917px] border-solid h-[751.667px] overflow-clip relative rounded-[11px] shrink-0 w-[880px]">
          <div className="absolute bg-[#24272d] h-[18.333px] left-[28.42px] rounded-[3.667px] top-[19.25px] w-[66px]" />
          <div className="[word-break:break-word] absolute content-stretch flex font-pretendard font-medium gap-[25.667px] items-center leading-[1.4] left-[494.08px] not-italic overflow-clip text-[#24272d] text-[12.833px] top-[19.25px] tracking-[-0.3208px] whitespace-nowrap">
            <p className="relative shrink-0">서비스 소개</p>
            <p className="relative shrink-0">요금</p>
            <p className="relative shrink-0">고객 문의</p>
          </div>
          <div className="absolute bg-[#f2f3f5] content-stretch flex items-center justify-center left-[765.42px] overflow-clip rounded-[915.75px] size-[29.333px] top-[13.75px]">
            <div className="relative shrink-0 size-[14.667px]">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgI} />
            </div>
          </div>
          <div className="absolute bg-[#f2f3f5] content-stretch flex items-center justify-center left-[805.75px] overflow-clip rounded-[915.75px] size-[29.333px] top-[13.75px]">
            <div className="relative shrink-0 size-[14.667px]">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgI1} />
            </div>
          </div>
          <div className="absolute bg-[#eeeff1] h-[0.917px] left-[-0.92px] top-[56.83px] w-[880px]" />
          <div className="[word-break:break-word] absolute font-pretendard font-bold leading-[0] left-[43.08px] not-italic text-[#111] text-[36.667px] top-[105.42px] tracking-[-0.9167px] whitespace-nowrap">
            <p className="leading-[1.3] mb-0">모두를 위한</p>
            <p className="leading-[1.3]">더 쉬운 서비스</p>
          </div>
          <p className="[word-break:break-word] absolute font-pretendard font-normal leading-[1.4] left-[43.08px] not-italic text-[#9d9d9d] text-[14.667px] top-[219.08px] tracking-[-0.3667px] whitespace-nowrap">
            누구나 편하게 사용할 수 있는 화면을 만들어요.
          </p>
          <div className="absolute bg-[#24272d] content-stretch flex h-[44px] items-center justify-center left-[43.08px] overflow-clip rounded-[9.167px] top-[259.42px] w-[110px]">
            <p className="[word-break:break-word] font-pretendard font-semibold leading-[1.4] not-italic relative shrink-0 text-[13.75px] text-white tracking-[-0.3438px] whitespace-nowrap">
              시작하기
            </p>
          </div>
          <div className="absolute border-[#d8dce3] border-[0.917px] border-solid content-stretch flex h-[44px] items-center justify-center left-[164.08px] overflow-clip rounded-[9.167px] top-[259.42px] w-[117.333px]">
            <p className="[word-break:break-word] font-pretendard font-semibold leading-[1.4] not-italic relative shrink-0 text-[#24272d] text-[13.75px] tracking-[-0.3438px] whitespace-nowrap">
              자세히 보기
            </p>
          </div>
          <div className="absolute bg-[#eef0f3] content-stretch flex h-[238.333px] items-center justify-center left-[475.75px] overflow-clip rounded-[14.667px] top-[94.42px] w-[359.333px]">
            <div className="relative shrink-0 size-[36.667px]">
              <img
                alt=""
                className="absolute block inset-0 max-w-none size-full"
                src={imgIconImage}
              />
            </div>
          </div>
          <p className="[word-break:break-word] absolute font-pretendard font-semibold leading-[1.4] left-[43.08px] not-italic text-[#111] text-[16.5px] top-[384.08px] tracking-[-0.4125px] whitespace-nowrap">
            뉴스레터 구독
          </p>
          <div className="absolute border-[#d8dce3] border-[0.917px] border-solid content-stretch flex h-[44px] items-center left-[43.08px] overflow-clip px-[14.667px] rounded-[9.167px] top-[420.75px] w-[330px]">
            <p className="[word-break:break-word] font-pretendard font-normal leading-[1.4] not-italic relative shrink-0 text-[#9ca3af] text-[13.75px] tracking-[-0.3438px] whitespace-nowrap">
              이메일을 입력하세요
            </p>
          </div>
          <div className="absolute bg-[#24272d] content-stretch flex items-center justify-center left-[380.42px] overflow-clip rounded-[9.167px] size-[44px] top-[420.75px]">
            <div className="relative shrink-0 size-[18.333px]">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgI2} />
            </div>
          </div>
          <div className="absolute bg-[#eef0f3] content-stretch flex h-[146.667px] items-center justify-center left-[43.08px] overflow-clip rounded-[11px] top-[501.42px] w-[249.333px]">
            <div className="relative shrink-0 size-[36.667px]">
              <img
                alt=""
                className="absolute block inset-0 max-w-none size-full"
                src={imgIconImage1}
              />
            </div>
          </div>
          <p className="[word-break:break-word] absolute font-pretendard font-semibold leading-[1.4] left-[43.08px] not-italic text-[#111] text-[14.667px] top-[660.92px] tracking-[-0.3667px] whitespace-nowrap">
            카드 제목 1
          </p>
          <p className="[word-break:break-word] absolute font-pretendard font-normal leading-[1.4] left-[43.08px] not-italic text-[#6f737a] text-[12.833px] top-[684.75px] tracking-[-0.3208px] whitespace-nowrap">
            설명 텍스트가 들어가요
          </p>
          <div className="absolute bg-[#eef0f3] content-stretch flex h-[146.667px] items-center justify-center left-[314.42px] overflow-clip rounded-[11px] top-[501.42px] w-[249.333px]">
            <div className="relative shrink-0 size-[36.667px]">
              <img
                alt=""
                className="absolute block inset-0 max-w-none size-full"
                src={imgIconImage2}
              />
            </div>
          </div>
          <p className="[word-break:break-word] absolute font-pretendard font-semibold leading-[1.4] left-[314.42px] not-italic text-[#111] text-[14.667px] top-[660.92px] tracking-[-0.3667px] whitespace-nowrap">
            카드 제목 2
          </p>
          <p className="[word-break:break-word] absolute font-pretendard font-normal leading-[1.4] left-[314.42px] not-italic text-[#6f737a] text-[12.833px] top-[684.75px] tracking-[-0.3208px] whitespace-nowrap">
            설명 텍스트가 들어가요
          </p>
          <div className="absolute bg-[#eef0f3] content-stretch flex h-[146.667px] items-center justify-center left-[585.75px] overflow-clip rounded-[11px] top-[501.42px] w-[249.333px]">
            <div className="relative shrink-0 size-[36.667px]">
              <img
                alt=""
                className="absolute block inset-0 max-w-none size-full"
                src={imgIconImage3}
              />
            </div>
          </div>
          <p className="[word-break:break-word] absolute font-pretendard font-semibold leading-[1.4] left-[585.75px] not-italic text-[#111] text-[14.667px] top-[660.92px] tracking-[-0.3667px] whitespace-nowrap">
            카드 제목 3
          </p>
          <p className="[word-break:break-word] absolute font-pretendard font-normal leading-[1.4] left-[585.75px] not-italic text-[#6f737a] text-[12.833px] top-[684.75px] tracking-[-0.3208px] whitespace-nowrap">
            설명 텍스트가 들어가요
          </p>
        </div>
      </div>
    </div>
  )
}
