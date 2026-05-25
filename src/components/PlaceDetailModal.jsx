import React from 'react';
import { MapPin, Phone, Clock, Plus, Check, Globe } from 'lucide-react';

export default function PlaceDetailModal({
  selectedPlace,
  setSelectedPlace,
  cart,
  handleToggleCart
}) {
  if (!selectedPlace) return null;

  const targetId = typeof selectedPlace.id === 'string' && selectedPlace.id.includes('-hotel-')
    ? selectedPlace.id.split('-hotel-')[1]
    : selectedPlace.id;

  const isInCart = cart.some(item => item.id === targetId);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(45, 55, 72, 0.4)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200,
      padding: '20px'
    }} onClick={() => setSelectedPlace(null)}>
      <div 
        className="glass" 
        style={{
          width: '100%',
          maxWidth: '460px',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          animation: 'fadeIn var(--transition-fast)',
          boxShadow: 'var(--shadow-lg)'
        }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 헤더 비주얼 */}
        <div style={{
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
          padding: '32px 24px',
          color: 'white',
          position: 'relative'
        }}>
          <span style={{
            background: 'rgba(255,255,255,0.2)',
            color: 'white',
            fontSize: '11px',
            fontWeight: 700,
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            display: 'inline-block',
            marginBottom: '8px'
          }}>
            {selectedPlace.category === 'tourist' ? '🏞️ 명소' : 
             selectedPlace.category === 'restaurant' ? '🍽️ 식당' : 
             selectedPlace.category === 'cafe' ? '☕ 카페' : '🏨 숙소'}
          </span>
          <h2 style={{ fontSize: '18px', fontWeight: 800, textShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
            {selectedPlace.name}
          </h2>
          <button 
            onClick={() => setSelectedPlace(null)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              color: 'white',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {/* 모달 내용 바디 */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* 반려견 동반 입장 규정 뱃지 박스 */}
          <div style={{ background: 'var(--secondary-light)', padding: '12px 16px', borderRadius: 'var(--radius-md)' }}>
            <h4 style={{ fontSize: '11px', fontWeight: 700, color: 'var(--secondary)', textTransform: 'uppercase' }}>🐕 동반 입장 규정</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-main)', fontWeight: 600, marginTop: '4px' }}>
              {selectedPlace.pet_rule}
            </p>
          </div>

          {/* 주소, 전화번호, 홈페이지, 영업시간 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={14} color="var(--primary)" />
              <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{selectedPlace.address}</span>
            </div>
            {selectedPlace.phone && selectedPlace.phone !== '정보 없음' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone size={14} color="var(--primary)" />
                <span style={{ color: 'var(--text-main)' }}>{selectedPlace.phone}</span>
              </div>
            )}
            {selectedPlace.homepage && selectedPlace.homepage !== '' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Globe size={14} color="var(--primary)" />
                <a 
                  href={selectedPlace.homepage.startsWith('http') ? selectedPlace.homepage : `https://${selectedPlace.homepage}`}
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline' }}
                >
                  공식 홈페이지 방문 🌐
                </a>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={14} color="var(--primary)" />
              <span style={{ color: 'var(--text-main)' }}>영업 시간: {selectedPlace.open_hours}</span>
            </div>
          </div>

          {/* 하단 관심 카트 제어 버튼 */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button
              onClick={() => {
                handleToggleCart(selectedPlace);
                setSelectedPlace(null);
              }}
              style={{
                flex: 1,
                background: isInCart ? 'var(--secondary)' : 'var(--primary)',
                color: 'white',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                fontWeight: 700,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              {isInCart ? <Check size={14} /> : <Plus size={14} />}
              {isInCart ? '관심 일정에서 제거' : '관심 일정에 추가'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
