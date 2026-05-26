import React, { useEffect, useRef } from 'react';

// D3.js 기반 일정 분석 도넛 차트
export default function ScheduleChart({ dayPlaces }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!dayPlaces || dayPlaces.length === 0 || !window.d3) return;

    const d3 = window.d3;

    // 1. 카테고리별 시간 계산
    const categoryMinutes = {
      '관광 명소': 0,
      '식당': 0,
      '카페': 0,
    };

    // 체류 시간 파싱
    const parseDurationText = (text) => {
      if (!text) return 0;
      if (
        text.includes('여정 종료') ||
        text.includes('체크인') ||
        text.includes('체크아웃') ||
        text.includes('출발')
      ) {
        return 0;
      }
      
      let mins = 0;
      const hourMatch = text.match(/(\d+)시간/);
      const minMatch = text.match(/(\d+)분/);
      
      if (hourMatch) mins += parseInt(hourMatch[1]) * 60;
      if (minMatch) mins += parseInt(minMatch[1]);
      
      return mins;
    };

    dayPlaces.forEach((p) => {
      // 숙소 및 랜드마크 집계 제외
      const isHotel = p.category === 'hotel' || p.id.includes('-hotel-');
      const isSpecialNode = p.id === 'start-landmark-node' || p.id === 'last-day-end-node';
      
      if (isHotel || isSpecialNode) return;

      // 체류 시간 집계
      const mins = parseDurationText(p.duration);
      if (mins <= 0) return;

      let catLabel = '관광 명소';
      if (p.category === 'restaurant') catLabel = '식당';
      if (p.category === 'cafe') catLabel = '카페';

      categoryMinutes[catLabel] += mins;
    });

    const chartData = Object.keys(categoryMinutes)
      .map((key) => ({ label: key, value: categoryMinutes[key] }))
      .filter((d) => d.value > 0);

    if (chartData.length === 0) {
      d3.select(svgRef.current).selectAll('*').remove();
      return;
    }

    // SVG 크기 세팅
    const width = 140;
    const height = 140;
    const radius = Math.min(width, height) / 2;

    // 기존 요소 제거
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    // 컬러 스케일 (지도 마커와 동일)
    const color = d3
      .scaleOrdinal()
      .domain(['관광 명소', '식당', '카페'])
      .range(['#4e79a7', '#e15759', '#f28e2b']);

    const pie = d3
      .pie()
      .value((d) => d.value)
      .sort(null);

    const arc = d3
      .arc()
      .innerRadius(radius * 0.58)
      .outerRadius(radius * 0.9);

    const arcs = svg
      .selectAll('.arc')
      .data(pie(chartData))
      .enter()
      .append('g')
      .attr('class', 'arc');

    // 패스 드로잉 및 애니메이션
    arcs
      .append('path')
      .attr('d', arc)
      .attr('fill', (d) => color(d.data.label))
      .attr('stroke', '#fff')
      .style('stroke-width', '2px')
      .style('cursor', 'pointer')
      .transition()
      .duration(700)
      .attrTween('d', function (d) {
        const i = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
        return function (t) {
          return arc(i(t));
        };
      });

    // 중앙 소요시간 텍스트
    svg
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-5px')
      .style('font-size', '9px')
      .style('font-weight', '700')
      .style('fill', 'var(--text-muted)')
      .text('활동 시간');

    const totalMins = d3.sum(chartData, (d) => d.value);
    const totalHours = (totalMins / 60).toFixed(1);

    svg
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '12px')
      .style('font-size', '13px')
      .style('font-weight', '850')
      .style('fill', 'var(--text-main)')
      .style('font-family', 'Outfit')
      .text(`${totalHours}h`);
  }, [dayPlaces]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        background: 'rgba(255,255,255,0.4)',
        padding: '12px 14px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border)',
        marginTop: '12px',
        marginBottom: '16px',
      }}
    >
      <svg ref={svgRef} style={{ flexShrink: 0 }}></svg>

      {/* 범례 리포트 */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '5px',
        }}
      >
        <h4
          style={{
            fontSize: '11px',
            fontWeight: 800,
            color: 'var(--text-main)',
            marginBottom: '2px',
            letterSpacing: '-0.2px',
          }}
        >
          📊 여행 일정 분석
        </h4>
        {dayPlaces &&
          (() => {
            const counts = {
              tourist: 0,
              restaurant: 0,
              cafe: 0,
              hotel: 0,
              landmark: 0,
            };
            dayPlaces.forEach(
              (p) => (counts[p.category] = (counts[p.category] || 0) + 1),
            );

            const categories = [
              { key: 'tourist', label: '명소 🏞️', color: '#4e79a7' },
              { key: 'restaurant', label: '식당 🍽️', color: '#e15759' },
              { key: 'cafe', label: '카페 ☕', color: '#f28e2b' },
              { key: 'hotel', label: '숙소 🏠', color: '#59a14f' },
            ];

            return categories.map((cat) => {
              const count = counts[cat.key] || 0;
              if (count === 0) return null;
              return (
                <div
                  key={cat.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '10px',
                  }}
                >
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                    }}
                  >
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: cat.color,
                        display: 'inline-block',
                      }}
                    ></span>
                    {cat.label}
                  </span>
                  <span
                    style={{
                      fontWeight: 800,
                      color: 'var(--text-main)',
                      fontFamily: 'Outfit',
                    }}
                  >
                    {count}개 장소
                  </span>
                </div>
              );
            });
          })()}
      </div>
    </div>
  );
}
