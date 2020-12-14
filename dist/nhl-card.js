class NhlCard extends HTMLElement {
  card_template = `
<style>
.nhl-card-content{font-family:Roboto, Noto, sans-serif;font-size:14px;display: grid;grid-template-columns: repeat(auto-fill, minmax(200px, auto)); width:100%;}
.nhl-card-match-container{margin:0 4px 4px;padding:5px; 0;background: var( --ha-card-background, var(--card-background-color, white) );border-radius: var(--ha-card-border-radius, 4px);box-shadow: var( --ha-card-box-shadow, 0px 2px 1px -1px rgba(0, 0, 0, 0.2), 0px 1px 1px 0px rgba(0, 0, 0, 0.14), 0px 1px 3px 0px rgba(0, 0, 0, 0.12) );}
.nhl-card-match{display: flex;flex-flow: row wrap;height:70px;min-width:190px;margin:1px;}
.nhl-card-teams{flex: 1 1;}
.nhl-card-team{display: flex;flex-flow: row;}
.nhl-card-team-image{background-size:contain;height:35px;width:35px;}
.nhl-card-team-name{flex: 1 1;vertical-align:middle;line-height:35px;padding-left:5px;white-space:nowrap;overflow:hidden;}
.nhl-card-team-score{width:25px;vertical-align:middle;line-height:35px;padding-right:5px;text-align:right;}
.nhl-card-period{width:15px;line-height:70px;vertical-align:middle;padding-right:5px;text-align:right;font-size:12px;}
.nhl-card-bold{font-weight:bold;}
</style>
<div class="nhl-card-content">{nhl-card}</div>
  `;

  match_template = `
	<div class="nhl-card-match-container">
		<div>{date} at {time}</div>
		<div class="nhl-card-match">
			<div class="nhl-card-teams">
				<div class="nhl-card-team">
					<div class="nhl-card-team-image" style="background-image:url(/hacsfiles/nhl-card/assets/{v}.png);"></div>
					<div class="nhl-card-team-name{myteamv}">{vnn}</div>
					<div class="nhl-card-team-score{myteamv}">{vs}</div>
				</div>
				<div class="nhl-card-team">
					<div class="nhl-card-team-image" style="background-image:url(/hacsfiles/nhl-card/assets/{h}.png);"></div>
					<div class="nhl-card-team-name{myteamh}">{hnn}</div>
					<div class="nhl-card-team-score{myteamh}">{hs}</div>
				</div>
			</div>
			<div class="nhl-card-period">{q}</div>
		</div>
	</div>
  `;

  set hass(hass) {
    if (!this.content) {
      this.card = document.createElement('ha-card');
      this.card.header = 'NHL Games';
      this.content = document.createElement('div');
      this.content.className = 'card-content';
      this.card.appendChild(this.content);
      this.appendChild(this.card);
    }
    this.render();
  }

  render() {
    fetch('https://statsapi.web.nhl.com/api/v1/schedule?startDate=2020-07-30&endDate=2020-08-05')
      .then((response) => {
        response.json().then((nhl_data) => {
          this.card.header = "Today's NHL Games " + nhl_data.w;
          let c = '';
          for (let i = 0; i < nhl_data.dates[0].games.length; i++) {
            if (this.getShowMatch(nhl_data.dates[0].games[i])) {
              let t = this.match_template.replace('{vnn}', nhl_data.dates[0].games[i].teams.away.team.name);
              t = t.replace('{hnn}', nhl_data.dates[0].games[i].teams.home.team.name);
              t = t.replace('{v}', nhl_data.dates[0].games[i].teams.away.team.id);
              t = t.replace('{h}', nhl_data.dates[0].games[i].teams.home.team.id);
              t = t.replace('{vs}', nhl_data.dates[0].games[i].teams.away.score);
              t = t.replace('{hs}', nhl_data.dates[0].games[i].teams.home.score);
              t = t.replace('{q}', nhl_data.dates[0].games[i].abstractGameState);
              t = t.replace('{date}', nhl_data.dates[0].games[i].gameDate);
              t = t.replace('{time}', nhl_data.dates[0].games[i].gameDate + 'PM EST');
              if (this.config.my_team == nhl_data.dates[0].games[i].v) {
                t = t.replace('{myteamv}', " nhl-card-bold");
                t = t.replace('{myteamv}', " nhl-card-bold");
                t = t.replace('{myteamh}', "");
                t = t.replace('{myteamh}', "");
              }
              else if (this.config.my_team == nhl_data.dates[0].games[i].h) {
                t = t.replace('{myteamv}', "");
                t = t.replace('{myteamv}', "");
                t = t.replace('{myteamh}', " nhl-card-bold");
                t = t.replace('{myteamh}', " nhl-card-bold");
              }
              else {
                t = t.replace('{myteamh}', "");
                t = t.replace('{myteamh}', "");
                t = t.replace('{myteamv}', "");
                t = t.replace('{myteamv}', "");
              }
              c += t;
            }
          }
          if (c == '' && this.config.only_today) {
            c = 'No games today';
          }
          else if (c == '' && !this.config.only_today) {
            c = 'No games this week';
          }
          this.content.innerHTML = this.card_template.replace('{nhl-card}', c);
        }).catch((error) => {
          console.error("Could not parse NHL Data!")
        });;
      }).catch((error) => {
        console.error("Could not load NHL Data!")
      });
  }
  setConfig(config) {
    this.config = {}
    if (config.only_today) {
      this.config.only_today = true;
    }
    else {
      this.config.only_today = false;
    }
    if (config.only_today_debug) {
      this.config.only_today_debug = config.only_today_debug;
    }

    if (config.my_team) {
      this.config.my_team = config.my_team;
    }
    else {
      this.config.my_team = '';
    }
    if (config.only_my_team) {
      this.config.only_my_team = config.only_my_team;
    }
    else {
      this.config.only_my_team = false;
    }

  }

  getShowMatch(match) {
    let i_today;
    if (this.config.only_today_debug) {
      i_today = this.config.only_today_debug
    }
    else {
      let today = new Date();

      i_today = parseInt('' + today.getFullYear() + ('0' + (today.getMonth() + 1)).slice(-2) + ('0' + today.getDate()).slice(-2) + '00');
    }

    let is_today = (match.eid >= i_today && match.eid <= (i_today + 99));

    let has_my_team = (match.v == this.config.my_team || match.h == this.config.my_team)

    if (this.config.only_today && this.config.only_my_team) {
      return (is_today && has_my_team);
    }
    else if (this.config.only_today && !this.config.only_my_team) {
      return is_today;
    }
    else if (!this.config.only_today && this.config.only_my_team) {
      return only_my_team;
    }
    else { // (!this.config.only_today && !this.config.only_my_team)
      return true;
    }
  }

  getDayOfWeek(abbv) {
    switch (abbv) {
      case 'Mon':
        return "Monday";
        break;
      case 'Tue':
        return "Tuesday";
        break;
      case 'Wed':
        return "Wednesday";
        break;
      case 'Thu':
        return "Thursday";
        break;
      case 'Fri':
        return "Friday";
        break;
      case 'Sat':
        return "Saturday";
        break;
      case 'Sun':
        return "Sunday";
        break;
    }
  }

  // The height of your card. Home Assistant uses this to automatically
  // distribute all cards over the available columns.
  getCardSize() {
    return 3;
  }
}

customElements.define('nhl-card', NhlCard);

console.info(
  '\n %c NHL Card %c v0.0.1 %c \n',
  'background-color: #555;color: #fff;padding: 3px 2px 3px 3px;border-radius: 3px 0 0 3px;font-family: DejaVu Sans,Verdana,Geneva,sans-serif;text-shadow: 0 1px 0 rgba(1, 1, 1, 0.3)',
  'background-color: #bc81e0;background-image: linear-gradient(90deg, #b65cff, #11cbfa);color: #fff;padding: 3px 3px 3px 2px;border-radius: 0 3px 3px 0;font-family: DejaVu Sans,Verdana,Geneva,sans-serif;text-shadow: 0 1px 0 rgba(1, 1, 1, 0.3)',
  'background-color: transparent'
);
