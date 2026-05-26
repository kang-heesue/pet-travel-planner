import React from 'react';
import {
  Map,
  MapPin,
  Calendar,
  ArrowRight,
  ArrowLeft,
  Compass,
} from 'lucide-react';

export default function SetupPage({
  regionInput,
  setRegionInput,
  selectedRegion,
  showRegionSuggestions,
  setShowRegionSuggestions,
  availableRegions,
  handleRegionChange,
  startSearchInput,
  setStartSearchInput,
  startPlaceName,
  showStartSuggestions,
  setShowStartSuggestions,
  startSuggestions,
  handleSelectStartPlace,
  getStartCandidates,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  handleResetSchedule,
  onStartPlanning,
  onBack,
}) {
  // 지역 목록 필터링
  const getFilteredRegions = () => {
    if (!regionInput) return availableRegions;
    return availableRegions.filter((r) =>
      r.toLowerCase().includes(regionInput.toLowerCase()),
    );
  };

  return (
    <div
      className="setup-container"
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #fbf8f3 0%, #eef5f1 100%)',
        padding: '24px',
        position: 'relative',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '10%',
          left: '5%',
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
          bottom: '12%',
          right: '8%',
          fontSize: '64px',
          opacity: 0.08,
          transform: 'rotate(25deg)',
          pointerEvents: 'none',
        }}
      >
        🐾
      </div>

      <div
        className="glass setup-card"
        style={{
          width: '100%',
          maxWidth: '540px',
          padding: '40px 48px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(255, 255, 255, 0.7)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          gap: '32px',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* 상단 헤더 */}
        <div
          style={{
            display: 'flex',
            justifyContent: onBack ? 'space-between' : 'flex-end',
            alignItems: 'center',
          }}
        >
          {onBack && (
            <button
              onClick={onBack}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--text-muted)',
              }}
              className="interactive"
            >
              <ArrowLeft size={14} />
              <span>이전으로</span>
            </button>
          )}
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--primary)',
              background: 'var(--primary-light)',
              padding: '2px 8px',
              borderRadius: '4px',
            }}
          >
            여행 조건 설정
          </span>
        </div>

        {/* 로고 헤더 */}
        <div style={{ textAlign: 'center' }} className="setup-header-section">
          <div
            className="setup-logo"
            style={{
              background:
                'linear-gradient(135deg, var(--primary) 0%, #e28f76 100%)',
              color: 'white',
              width: '64px',
              height: '64px',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              boxShadow: '0 8px 24px rgba(224, 122, 95, 0.25)',
            }}
          >
            <Compass className="setup-logo-icon" size={32} />
          </div>
          <h1
            className="setup-title"
            style={{
              fontSize: '28px',
              fontWeight: 950,
              color: 'var(--text-main)',
              letterSpacing: '-1px',
              marginBottom: '4px',
            }}
          >
            놀러가개 🐾
          </h1>
          <h2
            className="setup-subtitle"
            style={{
              fontSize: '18px',
              fontWeight: 800,
              color: 'var(--text-main)',
              letterSpacing: '-0.5px',
              marginTop: '8px',
            }}
          >
            어디로, 언제 떠나시나요? ✈️
          </h2>
          <p
            className="setup-description"
            style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              marginTop: '4px',
              fontWeight: 600,
            }}
          >
            실제 동반 데이터를 기반으로 한 최적의 동선 설계
          </p>
        </div>

        {/* 설정 폼 */}
        <div className="setup-form" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* 1. 여행 희망 지역 검색 */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              position: 'relative',
            }}
          >
            <label
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--text-main)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Map size={14} color="var(--primary)" /> 1. 어디로 여행을
              떠나시나요?
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="예: 부산, 강릉, 춘천, 속초, 양양..."
                value={regionInput}
                onChange={(e) => {
                  setRegionInput(e.target.value);
                  setShowRegionSuggestions(true);
                }}
                onFocus={() => setShowRegionSuggestions(true)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1.5px solid var(--border)',
                  outline: 'none',
                  fontSize: '14px',
                  fontWeight: 600,
                  backgroundColor: '#fff',
                }}
              />
              {showRegionSuggestions && getFilteredRegions().length > 0 && (
                <div
                  className="glass"
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    maxHeight: '180px',
                    overflowY: 'auto',
                    borderRadius: 'var(--radius-sm)',
                    marginTop: '4px',
                    zIndex: 100,
                    border: '1px solid var(--border)',
                    background: '#fff',
                  }}
                >
                  {getFilteredRegions().map((region) => (
                    <div
                      key={region}
                      onClick={() => {
                        handleRegionChange(region);
                      }}
                      style={{
                        padding: '10px 16px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 600,
                        borderBottom: '1.5px solid var(--border)',
                        backgroundColor:
                          selectedRegion === region
                            ? 'var(--primary-light)'
                            : 'transparent',
                        color:
                          selectedRegion === region
                            ? 'var(--primary)'
                            : 'var(--text-main)',
                      }}
                    >
                      📍 {region}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 2. 시작 중심지 설정 */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              position: 'relative',
            }}
          >
            <label
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--text-main)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <MapPin size={14} color="var(--secondary)" /> 2. 여행을 시작할
              중심지는 어디인가요?
            </label>

            {/* 중심지 직접 검색 */}
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="출발지(호텔, 역, 터미널 등) 명칭 직접 검색..."
                value={startSearchInput}
                onChange={(e) => {
                  setStartSearchInput(e.target.value);
                  setShowStartSuggestions(true);
                }}
                onFocus={() => setShowStartSuggestions(true)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1.5px solid var(--border)',
                  outline: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  backgroundColor: '#fff',
                }}
              />
              {showStartSuggestions && startSuggestions.length > 0 && (
                <div
                  className="glass"
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    maxHeight: '180px',
                    overflowY: 'auto',
                    borderRadius: 'var(--radius-sm)',
                    marginTop: '4px',
                    zIndex: 100,
                    border: '1px solid var(--border)',
                    background: '#fff',
                  }}
                >
                  {startSuggestions.map((landmark, idx) => (
                    <div
                      key={`start-suggest-${idx}`}
                      onClick={() => handleSelectStartPlace(landmark)}
                      style={{
                        padding: '10px 16px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 600,
                        borderBottom: '1px solid var(--border)',
                      }}
                    >
                      🏠 {landmark.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 추천 후보 칩 목록 */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px',
                marginTop: '6px',
              }}
            >
              {getStartCandidates(selectedRegion).map((landmark, idx) => (
                <button
                  key={`landmark-chip-${idx}`}
                  onClick={() => handleSelectStartPlace(landmark)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '11px',
                    fontWeight: 700,
                    backgroundColor:
                      startPlaceName === landmark.name
                        ? 'var(--primary)'
                        : 'rgba(0,0,0,0.03)',
                    color:
                      startPlaceName === landmark.name
                        ? 'white'
                        : 'var(--text-main)',
                    border: '1px solid transparent',
                    transition: 'var(--transition-fast)',
                  }}
                  className="interactive"
                >
                  {landmark.name}
                </button>
              ))}
            </div>
          </div>

          {/* 3. 일정 선택 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--text-main)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Calendar size={14} color="var(--primary)" /> 3. 여행 일정 선택
              (달력)
            </label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  handleResetSchedule();
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1.5px solid var(--border)',
                  outline: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  backgroundColor: '#fff',
                }}
              />
              <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>
                ~
              </span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  handleResetSchedule();
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1.5px solid var(--border)',
                  outline: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  backgroundColor: '#fff',
                }}
              />
            </div>
          </div>
        </div>

        {/* 일정 계획 완료 및 메인화면 기동 버튼 */}
        <button
          onClick={onStartPlanning}
          style={{
            width: '100%',
            background:
              'linear-gradient(135deg, var(--primary) 0%, #cb6b51 100%)',
            color: 'white',
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            fontWeight: 700,
            fontSize: '15px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 8px 24px rgba(224, 122, 95, 0.3)',
            transition: 'var(--transition-fast)',
          }}
          className="interactive"
        >
          <span>나만의 최적 일정 만들기 ⚡</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
