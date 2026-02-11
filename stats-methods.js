// This file contains the stats page methods to be added to script.js

// Add this method after showAchievements() in script.js:

showStatsPage() {
    // Get daily statistics
    const dailyStats = this.getDailyStatistics();
    const userStats = this.getUserStatistics();

    const statsHTML = `
      <div id="statsPageModal" class="modal show" style="z-index: 9999;">
        <div class="modal-content stats-modal" style="max-width: 95%; max-height: 95vh; overflow-y: auto; border-radius: 15px;">
          <div class="modal-header" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 15px 15px 0 0; display: flex; justify-content: space-between; align-items: center;">
            <h2 style="margin: 0; display: flex; align-items: center; gap: 10px; font-size: 28px;">
              📊 ${this.userName}'s Stats
            </h2>
            <button class="modal-close" onclick="game.closeModal('statsPageModal')" style="background: white; color: #667eea; border: none; width: 40px; height: 40px; border-radius: 50%; font-size: 24px; cursor: pointer;">✕</button>
          </div>
          
          <div class="modal-body stats-body" style="padding: 20px; background: #f8f9fa;">
            
            <!-- USER STATISTICS SECTION -->
            <div style="margin-bottom: 30px;">
              <h3 style="color: #667eea; font-size: 22px; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
                📈 User Statistics
              </h3>
              
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 20px;">
                <div class="stat-card" style="background: white; padding: 15px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); text-align: center; border-left: 4px solid #667eea;">
                  <div style="font-size: 24px; color: #667eea; font-weight: bold;">${userStats.totalSessions}</div>
                  <div style="color: #666; font-size: 12px; margin-top: 5px;">Total Sessions</div>
                </div>
                
                <div class="stat-card" style="background: white; padding: 15px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); text-align: center; border-left: 4px solid #10b981;">
                  <div style="font-size: 24px; color: #10b981; font-weight: bold;">${userStats.accuracy}%</div>
                  <div style="color: #666; font-size: 12px; margin-top: 5px;">Overall Accuracy</div>
                </div>
                
                <div class="stat-card" style="background: white; padding: 15px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); text-align: center; border-left: 4px solid #f59e0b;">
                  <div style="font-size: 24px; color: #f59e0b; font-weight: bold;">${userStats.totalScore}</div>
                  <div style="color: #666; font-size: 12px; margin-top: 5px;">Total Score</div>
                </div>
                
                <div class="stat-card" style="background: white; padding: 15px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); text-align: center; border-left: 4px solid #ef4444;">
                  <div style="font-size: 24px; color: #ef4444; font-weight: bold;">${userStats.totalQuestionsAnswered}</div>
                  <div style="color: #666; font-size: 12px; margin-top: 5px;">Questions Answered</div>
                </div>
                
                <div class="stat-card" style="background: white; padding: 15px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); text-align: center; border-left: 4px solid #06b6d4;">
                  <div style="font-size: 24px; color: #06b6d4; font-weight: bold;">${userStats.correctAnswers}</div>
                  <div style="color: #666; font-size: 12px; margin-top: 5px;">Correct Answers</div>
                </div>
                
                <div class="stat-card" style="background: white; padding: 15px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); text-align: center; border-left: 4px solid #8b5cf6;">
                  <div style="font-size: 24px; color: #8b5cf6; font-weight: bold;">${this.plantStage}</div>
                  <div style="color: #666; font-size: 12px; margin-top: 5px;">Plant Stage</div>
                </div>
                
                <div class="stat-card" style="background: white; padding: 15px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); text-align: center; border-left: 4px solid #ec4899;">
                  <div style="font-size: 24px; color: #ec4899; font-weight: bold;">${userStats.avgReactionTime}ms</div>
                  <div style="color: #666; font-size: 12px; margin-top: 5px;">Avg Reaction Time</div>
                </div>
              </div>
              
              <div style="background: white; padding: 15px; border-radius: 10px; margin-top: 15px;">
                <h4 style="color: #333; margin: 0 0 10px 0;">📱 Activity Breakdown</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 10px; font-size: 12px;">
                  ${this.generateActivityBreakdown(userStats.gamesPlayed)}
                </div>
              </div>
            </div>
            
            <!-- USER CONSISTENCY SECTION -->
            <div>
              <h3 style="color: #667eea; font-size: 22px; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
                📅 Daily Activity
              </h3>
              
              <div style="background: white; border-radius: 10px; overflow-x: auto; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                  <thead>
                    <tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                      <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Date</th>
                      <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Sessions</th>
                      <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Time (mins)</th>
                      <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Score</th>
                      <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Streak</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${dailyStats.map((day, idx) => \`
                      <tr style="background: \${idx % 2 === 0 ? '#f9f9f9' : 'white'}; border-bottom: 1px solid #eee;">
                        <td style="padding: 12px; border: 1px solid #ddd; font-weight: 500;">\${day.date}</td>
                        <td style="padding: 12px; text-align: center; border: 1px solid #ddd;"><span style="background: #667eea; color: white; padding: 4px 8px; border-radius: 4px;">\${day.sessions}</span></td>
                        <td style="padding: 12px; text-align: center; border: 1px solid #ddd;">\${day.totalTime}</td>
                        <td style="padding: 12px; text-align: center; border: 1px solid #ddd;"><span style="background: #10b981; color: white; padding: 4px 8px; border-radius: 4px;">\${day.score}</span></td>
                        <td style="padding: 12px; text-align: center; border: 1px solid #ddd;"><span style="background: #f59e0b; color: white; padding: 4px 8px; border-radius: 4px;">\${day.streak}</span></td>
                      </tr>
                    \`).join("")}
                  </tbody>
                </table>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    `;

    const existingModal = document.getElementById("statsPageModal");
    if (existingModal) existingModal.remove();

    document.body.insertAdjacentHTML("beforeend", statsHTML);
  }

  generateActivityBreakdown(gamesPlayed) {
    return Object.entries(gamesPlayed)
      .map(([game, count]) => `<div style="background: #f0f0f0; padding: 8px; border-radius: 5px; text-align: center;"><strong>${count}</strong><br>${game}</div>`)
      .join("");
  }

  getUserStatistics() {
    const accuracy = this.stats.totalQuestionsAnswered > 0
      ? ((this.stats.correctAnswers / this.stats.totalQuestionsAnswered) * 100).toFixed(1)
      : 0;

    // Calculate average reaction time from session data
    const reactionTimesWithData = this.sessionData.filter(d => d.responseTime > 0);
    const avgReactionTime = reactionTimesWithData.length > 0
      ? Math.round(reactionTimesWithData.reduce((sum, d) => sum + d.responseTime, 0) / reactionTimesWithData.length)
      : 0;

    return {
      totalSessions: this.stats.totalSessions || 0,
      accuracy: accuracy,
      totalScore: this.score,
      totalQuestionsAnswered: this.stats.totalQuestionsAnswered || 0,
      correctAnswers: this.stats.correctAnswers || 0,
      gamesPlayed: this.stats.gamesPlayed || {},
      avgReactionTime: avgReactionTime,
    };
  }

  getDailyStatistics() {
    // Get daily stats from localStorage
    const dailyKey = `dailyStats_${this.hashUsername(this.userName)}`;
    let dailyStats = JSON.parse(localStorage.getItem(dailyKey)) || {};

    // Create array of last 30 days of data
    const stats = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayData = dailyStats[dateStr] || { sessions: 0, totalTime: 0, score: 0, streak: 0, totalReactionTime: 0, reactionCount: 0 };

      stats.push({
        date: this.formatDate(dateStr),
        sessions: dayData.sessions || 0,
        totalTime: Math.round((dayData.totalTime || 0) / 1000 / 60), // Convert ms to minutes
        score: dayData.score || 0,
        streak: dayData.streak || 0,
      });
    }

    return stats;
  }

  formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  recordDailyStatistics() {
    if (!this.userName) return;

    const today = new Date().toISOString().split('T')[0];
    const dailyKey = `dailyStats_${this.hashUsername(this.userName)}`;
    let dailyStats = JSON.parse(localStorage.getItem(dailyKey)) || {};

    // Calculate session duration correctly
    const sessionDuration = this.sessionStartTime ? (Date.now() - this.sessionStartTime) : 0;

    if (!dailyStats[today]) {
      dailyStats[today] = {
        sessions: 0,
        totalTime: 0,
        score: 0,
        streak: this.streak,
        totalReactionTime: 0,
        reactionCount: 0,
      };
    }

    dailyStats[today].sessions = (dailyStats[today].sessions || 0) + 1;
    dailyStats[today].totalTime = (dailyStats[today].totalTime || 0) + sessionDuration;
    dailyStats[today].score = this.score;
    dailyStats[today].streak = this.streak;
    
    // Track reaction times from session data
    const sessionReactionTimes = this.sessionData.filter(d => d.responseTime > 0).map(d => d.responseTime);
    if (sessionReactionTimes.length > 0) {
      dailyStats[today].totalReactionTime = (dailyStats[today].totalReactionTime || 0) + sessionReactionTimes.reduce((a, b) => a + b, 0);
      dailyStats[today].reactionCount = (dailyStats[today].reactionCount || 0) + sessionReactionTimes.length;
    }

    localStorage.setItem(dailyKey, JSON.stringify(dailyStats));
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.remove();
    }
  }
