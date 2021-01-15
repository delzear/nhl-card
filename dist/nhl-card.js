class NhlCard extends HTMLElement {
  card_template = `
<style>
.nhl-card-content{font-family:Roboto, Noto, sans-serif;font-size:14px;display: grid;grid-template-columns: repeat(auto-fill, minmax(200px, auto)); width:100%;}
.nhl-card-match-container{margin:0 4px 4px;padding:5px; 0;background: var( --ha-card-background, var(--card-background-color, white) );border-radius: var(--ha-card-border-radius, 4px);box-shadow: var( --ha-card-box-shadow, 0px 2px 1px -1px rgba(0, 0, 0, 0.2), 0px 1px 1px 0px rgba(0, 0, 0, 0.14), 0px 1px 3px 0px rgba(0, 0, 0, 0.12) );}
.nhl-card-match{display: flex;flex-flow: row wrap;height:70px;min-width:190px;margin:1px;}
.nhl-card-teams{flex: 1 1;}
.nhl-card-team{display: flex;flex-flow: row;}
.nhl-card-team-image{background-size:contain;height:35px;width:35px;background-repeat:no-repeat;background-position:center center}
.nhl-card-team-name{flex: 1 1;vertical-align:middle;line-height:35px;padding-left:5px;white-space:nowrap;overflow:hidden;}
.nhl-card-team-score{width:25px;vertical-align:middle;line-height:35px;padding-right:5px;text-align:right;}
.nhl-card-period{width:15px;line-height:70px;vertical-align:middle;padding-right:5px;text-align:left;font-size:12px;}
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
      this.card.header = "This week's NHL Games";
      this.content = document.createElement('div');
      this.content.className = 'card-content';
      this.card.appendChild(this.content);
      this.appendChild(this.card);
    }
    this.render();
  }

  render() {
    let today = new Date();
    let tmrow = new Date();
    if (this.config.only_today_debug) {
      today = new Date(this.config.only_today_debug);
      tmrow = new Date(this.config.only_today_debug);
    }
    today = this.addDays(today, today.getDay() * -1);
    tmrow = this.addDays(tmrow, tmrow.getDay() * -1);
    tmrow = this.addDays(tmrow, 7);
    let start = today.getFullYear() + "-" + this.pad(today.getMonth() + 1, 2) + '-' + this.pad(today.getDate(), 2);
    let end = tmrow.getFullYear() + "-" + this.pad(tmrow.getMonth() + 1, 2) + '-' + this.pad(tmrow.getDate(), 2);
    fetch('https://statsapi.web.nhl.com/api/v1/schedule?startDate=' + start + '&endDate=' + end)
      //fetch('https://bdfed.stitch.mlbinfra.com/bdfed/transform-mlb-scoreboard?sportId=1&startDate=2020-10-27&endDate=2020-10-27')
      .then((response) => {
        response.json().then((nhl_data) => {
          this.card.header = "This week's NHL Games";
          let c = '';
          if (nhl_data.dates.length > 0) {
            for (let j = 0; j < nhl_data.dates.length; j++) {
              for (let i = 0; i < nhl_data.dates[j].games.length; i++) {
                if (this.getShowMatch(nhl_data.dates[j].games[i])) {
                  let matchDate = this.getDateFromNHLString(nhl_data.dates[j].games[i].gameDate);

                  let t = this.match_template.replaceAll('{vnn}', this.getTeamName(nhl_data.dates[j].games[i].teams.away.team.id));
                  t = t.replaceAll('{hnn}', this.getTeamName(nhl_data.dates[j].games[i].teams.home.team.id));
                  t = t.replaceAll('{v}', nhl_data.dates[j].games[i].teams.away.team.id);
                  t = t.replaceAll('{h}', nhl_data.dates[j].games[i].teams.home.team.id);
                  t = t.replaceAll('{vs}', nhl_data.dates[j].games[i].teams.away.score);
                  t = t.replaceAll('{hs}', nhl_data.dates[j].games[i].teams.home.score);
                  t = t.replaceAll('{q}', this.getGameStatus(nhl_data.dates[j].games[i].status.abstractGameState));
                  t = t.replaceAll('{date}', this.getDayOfWeek(matchDate));
                  t = t.replaceAll('{time}', this.getGameTime(matchDate));
                  if (this.config.my_team == nhl_data.dates[j].games[i].teams.away.team.id) {
                    t = t.replaceAll('{myteamv}', " nhl-card-bold");
                    t = t.replaceAll('{myteamh}', "");
                  }
                  else if (this.config.my_team == nhl_data.dates[j].games[i].teams.home.team.id) {
                    t = t.replaceAll('{myteamv}', "");
                    t = t.replaceAll('{myteamh}', " nhl-card-bold");
                  }
                  else {
                    t = t.replaceAll('{myteamh}', "");
                    t = t.replaceAll('{myteamv}', "");
                  }
                  c += t;
                }
              }
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
      i_today = new Date(this.config.only_today_debug);
    }
    else {
      i_today = new Date();
    }
    let matchDate = this.getDateFromNHLString(match.gameDate);
    let is_today = (matchDate >= i_today && matchDate <= (this.addDays(i_today, 1)));

    let has_my_team = (match.teams.away.team.id == this.config.my_team || match.teams.home.team.id == this.config.my_team)

    if (this.config.only_today && this.config.only_my_team) {
      return (is_today && has_my_team);
    }
    else if (this.config.only_today && !this.config.only_my_team) {
      return is_today;
    }
    else if (!this.config.only_today && this.config.only_my_team) {
      return has_my_team;
    }
    else { // (!this.config.only_today && !this.config.only_my_team)
      return true;
    }
  }

  getDateFromNHLString(dateStr) {
    //2020-07-30T20:00:00Z
    return new Date(dateStr);
  }

  getDayOfWeek(date) {
    return ["","Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][date.getDay()];
  }
  getGameTime(date) {
    return this.pad(date.getHours(), 2) + ":" + this.pad(date.getMinutes(), 2);
  }
  getGameStatus(gameState) {
    switch (gameState) {
      case "Final":
        return "F";
      default:
        return "";
    }
  }
  getTeamName(teamId) {
    let teams = [
      "",
      "Devils",
      "Islanders",
      "Rangers",
      "Flyers",
      "Penguins",
      "Bruins",
      "Sabres",
      "Canadiens",
      "Senators",
      "Maple Leafs",
      "",
      "Hurricanes",
      "Panthers",
      "Lightning",
      "Capitals",
      "Blackhawks",
      "Red Wings",
      "Predators",
      "Blues",
      "Flames",
      "Avalanches",
      "Oilers",
      "Canucks",
      "Ducks",
      "Stars",
      "Kings",
      "",
      "Sharks",
      "Blue Jackets",
      "Wild",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "Jets",
      "Coyotes",
      "Golden Knights",
      "Kracken"
    ];
    return teams[teamId];
  }

  // The height of your card. Home Assistant uses this to automatically
  // distribute all cards over the available columns.
  getCardSize() {
    return 3;
  }
  pad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
  }
  addDays(date, days) {
    date.setDate(date.getDate() + days);
    return date;
  }

}

customElements.define('nhl-card', NhlCard);

console.info(
  '\n %c NHL Card %c v0.0.1 %c \n',
  'background-color: #555;color: #fff;padding: 3px 2px 3px 3px;border-radius: 3px 0 0 3px;font-family: DejaVu Sans,Verdana,Geneva,sans-serif;text-shadow: 0 1px 0 rgba(1, 1, 1, 0.3)',
  'background-color: #bc81e0;background-image: linear-gradient(90deg, #b65cff, #11cbfa);color: #fff;padding: 3px 3px 3px 2px;border-radius: 0 3px 3px 0;font-family: DejaVu Sans,Verdana,Geneva,sans-serif;text-shadow: 0 1px 0 rgba(1, 1, 1, 0.3)',
  'background-color: transparent'
);