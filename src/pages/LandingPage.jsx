import React from 'react';
import { Compass, ArrowRight } from 'lucide-react';

export default function LandingPage({ onStart }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #fbf8f3 0%, #eef5f1 100%)',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 강아지 발자국 데코 장식 */}
      <div
        style={{
          position: 'absolute',
          top: '10%',
          left: '8%',
          fontSize: '48px',
          opacity: 0.08,
          transform: 'rotate(-15deg)',
          pointerEvents: 'none',
        }}
      >
        🐾
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: '15%',
          right: '10%',
          fontSize: '64px',
          opacity: 0.08,
          transform: 'rotate(25deg)',
          pointerEvents: 'none',
        }}
      >
        🐾
      </div>
      <div
        style={{
          position: 'absolute',
          top: '40%',
          right: '5%',
          fontSize: '32px',
          opacity: 0.05,
          transform: 'rotate(40deg)',
          pointerEvents: 'none',
        }}
      >
        🐾
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: '8%',
          left: '15%',
          fontSize: '40px',
          opacity: 0.05,
          transform: 'rotate(-30deg)',
          pointerEvents: 'none',
        }}
      >
        🐾
      </div>

      <div
        className="glass"
        style={{
          width: '100%',
          maxWidth: '500px',
          padding: '48px 40px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(255, 255, 255, 0.7)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '36px',
          position: 'relative',
          zIndex: 10,
          textAlign: 'center',
        }}
      >
        {/* 타이틀 로고 헤더 */}
        <div>
          <div
            style={{
              background:
                'linear-gradient(135deg, var(--primary) 0%, #e28f76 100%)',
              color: 'white',
              width: '72px',
              height: '72px',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px auto',
              boxShadow: '0 8px 24px rgba(224, 122, 95, 0.25)',
            }}
          >
            <Compass size={36} />
          </div>

          <h1
            style={{
              fontSize: '32px',
              fontWeight: 950,
              color: 'var(--text-main)',
              letterSpacing: '-1.5px',
              lineHeight: '1.2',
            }}
          >
            놀러가개 🐾
          </h1>

          <p
            style={{
              fontSize: '14px',
              color: 'var(--text-muted)',
              marginTop: '12px',
              fontWeight: 600,
              lineHeight: '1.6',
            }}
          >
            전국 2,700여 개 실제 반려견 동반처 정보와
            <br />
            공식 실시간 API 기반의 과학적 최적 동선 플래너
          </p>
        </div>

        {/* 펫 친화 설명 박스 */}
        <div
          style={{
            width: '100%',
            background: 'rgba(224, 122, 95, 0.04)',
            border: '1px dashed rgba(224, 122, 95, 0.3)',
            padding: '16px 20px',
            borderRadius: 'var(--radius-md)',
            fontSize: '12px',
            color: 'var(--text-muted)',
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div>
            ✨ <strong>실시간 하이브리드 연동</strong>: 공공 데이터 API 실시간
            통신 및 백업 정밀 CSV 캐싱
          </div>
          <div>
            🚶‍♂️ <strong>편리한 출발지 셋업</strong>: 특정 터미널, KTX역, 혹은
            희망 랜드마크 중심지 출발 지원
          </div>
          <div>
            ⚡ <strong>1초 최적화 엔진</strong>: 최근접 탐욕(Greedy TSP) 정렬로
            일자별 균등 낭비 없는 동선
          </div>
        </div>

        {/* 일정 계획 시작 버튼 */}
        <button
          onClick={onStart}
          style={{
            width: '100%',
            background:
              'linear-gradient(135deg, var(--primary) 0%, #cb6b51 100%)',
            color: 'white',
            padding: '18px',
            borderRadius: 'var(--radius-md)',
            fontWeight: 800,
            fontSize: '15px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 8px 24px rgba(224, 122, 95, 0.3)',
            cursor: 'pointer',
          }}
          className="interactive"
        >
          <span>나만의 반려견 동반 일정 만들기 ⚡</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
