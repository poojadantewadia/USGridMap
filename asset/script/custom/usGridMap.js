class USGridMap {
  constructor(id) {
    this.id = id;
    this.ele = d3.select('#' + id);
    this.width = d3.select('#' + id).node().clientWidth;
    this.height = d3.select('#' + id).node().clientHeight;
    this.legendHeight = 10;
    this.margin = { top: 20, right: 20, bottom: 80, left: 20 };
    this.svg;
    this.usMapData;
    this.duration = 500;
    this.nestData;
    this.data;
    this.avrageData = [];
    this.gridMapG;
    this.gridsPath = 'asset/data/publicationGrids.csv';
    this.linkPath = 'asset/data/links.csv';
    this.dataPath = 'asset/data/usData.csv';
    this.cellSize;
    this.gridData;
    this.padding = 10;
    // WHITE // BLACK OR AFRICAN AMERICAN • AMERICAN INDIAN OR ALASKAN NATIVE • ASIAN
    // NATIVE HAWAIIAN OR PACIFIC ISLANDER
    // OTHER O TWO CATEGORIES
    // HISPANIC/LATINO
    this.labelTootlTipConfig = {
      White: 'White',
      Black: 'Black',
      AIndAKNt: 'American Indian or Alaska Native',
      AAPI: 'asian',
      NHAAPI: 'Native Hawaiian and Other Pacific Islander',
      Hisp: 'Hispanic/latino',
      NHBlack: 'two Categories - NH Black',
      NHWhite: 'two Categories -NH White',
    };
    this.colorScale = d3
      .scaleOrdinal()
      .domain([
        'White',
        'Black',
        'AIndAKNt',
        'AAPI',
        'NHAAPI',
        'Hisp',
        'NHBlack',
        'NHWhite',
      ])
      .range([
        '#e27449',
        '#67bec7',
        '#c8439d',
        '#5c42d1',
        '#56ab5d',
        '#e84734',
        '#515151',
        '#999999',
      ]);
    this.loadData();
  }

  createEle() {
    this.tooltip = d3.select('#tooltip');
    this.svg = this.ele
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height);

    this.svgG = this.svg
      .append('g')
      .attr('class', 'svgG')
      .attr(
        'transform',
        'translate(' + this.margin.left + ',' + this.margin.top + ')'
      );
    this.legendG = this.svgG.append('g').attr('class', 'legendG');

    // calculate cellSize based on dimensions of svg
    this.cellSize = this.calcCellSize(
      this.width - (this.margin.left + this.margin.right),
      this.height - (this.margin.bottom + this.margin.top),
      13,
      8
    );

    // generate grid data with specified number of columns and rows
    this.gridData = this.getGridData(13, 8, this.cellSize);
    // const parenG = this.svgG
    //   .append('g')
    //   .attr('transform', 'translate(' + 0 + ',' + this.legendHeight + ')');
    this.gridMapG = this.svgG.append('g').attr('class', 'gridMapG');
  }

  // Get Data from JSON
  loadData() {
    d3.queue()
      .defer(d3.csv, this.gridsPath)
      .defer(d3.csv, this.dataPath)
      .await((e, gridData, data) => {
        // console.log(e, gridData, data);

        // group data by publication
        this.nestData = d3
          .nest()
          .key(function (d) {
            return d.publication;
          })
          .entries(gridData);
        this.data = data;
        this.createEle();

        this.ready();
        this.updateSize();
      });
  }

  ready() {
    let selectPub = this.nestData.find(function (d) {
      return d.key == 'NPR';
    });

    const uniqStateData = d3
      .nest()
      .key(function (d) {
        return d.STATE;
      })
      .entries(this.data);
    this.avrageData = [];
    uniqStateData.forEach((e) => {
      const objectData = { STATE: e.key };
      objectData.Population = d3.mean(e.values, function (d) {
        return d.Population;
      });
      objectData.White = d3.mean(e.values, function (d) {
        return d['White.perc'];
      });
      objectData.Black = d3.mean(e.values, function (d) {
        return d['Black.perc'];
      });
      objectData.AAPI = d3.mean(e.values, function (d) {
        return d['AAPI.perc'];
      });
      objectData.AIndAKNt = d3.mean(e.values, function (d) {
        return d['AInd_AKNt.perc'];
      });
      objectData.Hisp = d3.mean(e.values, function (d) {
        return d['Hisp.perc'];
      });
      objectData.NHWhite = d3.mean(e.values, function (d) {
        return d['NH_White.perc'];
      });
      objectData.NHBlack = d3.mean(e.values, function (d) {
        return d['NH_Black.perc'];
      });
      objectData.NHAAPI = d3.mean(e.values, function (d) {
        return d['NH_AAPI.perc'];
      });

      const selectState = selectPub.values.find((d) => d.code == e.key);

      const ChildData = [
        {
          name: 'White',
          value: objectData.White,
          state: selectState.state,
          code: selectState.code,
        },
        {
          name: 'Black',
          value: objectData.Black,
          state: selectState.state,
          code: selectState.code,
        },
        {
          name: 'AAPI',
          value: objectData.AAPI,
          state: selectState.state,
          code: selectState.code,
        },
        {
          name: 'AIndAKNt',
          value: objectData.AIndAKNt,
          state: selectState.state,
          code: selectState.code,
        },
        {
          name: 'Hisp',
          value: objectData.Hisp,
          state: selectState.state,
          code: selectState.code,
        },
        {
          name: 'NHWhite',
          value: objectData.NHWhite,
          state: selectState.state,
          code: selectState.code,
        },
        {
          name: 'NHBlack',
          value: objectData.NHBlack,
          state: selectState.state,
          code: selectState.code,
        },
        {
          name: 'NHAAPI',
          value: objectData.NHAAPI,
          state: selectState.state,
          code: selectState.code,
        },
      ];

      const RootData = d3
        .treemap()
        .size([this.cellSize, this.cellSize])
        .padding(1)
        .round(true)(
        d3
          .hierarchy({ children: ChildData })
          .sum((d) => d.value)
          .sort((a, b) => b.value - a.value)
      );

      objectData.RootData = RootData.leaves();
      this.avrageData.push(objectData);
    });

    // console.log('avrageData', uniqStateData)
    this.drawGridMap('NPR');
  }

  // function to create initial map
  drawGridMap(publication) {
    // filter data to return the object of publication of interest
    let selectPub = this.nestData.find(function (d) {
      return d.key == publication;
    });
    selectPub.values.forEach((e, i) => {
      const stateData = this.avrageData.find((d) => d.STATE == e.code);
      if (stateData) {
        selectPub.values[i].RootData = stateData.RootData;
      } else {
        selectPub.values[i].RootData = [];
      }
    });
    // use a key function to bind rects to states
    const selectStates = this.gridMapG
      .selectAll('g.state')
      .data(selectPub.values, (d) => {
        return d.code;
      });
    selectStates.exit().remove();
    // draw state rects
    const updateStaes = selectStates
      .enter()
      .append('g')
      .merge(selectStates)
      .attr('class', (d) => {
        return 'state ' + d.code;
      })
      .attr('transform', (d) => {
        return `translate(${(d.col - 1) * (this.cellSize + this.padding)},${
          (d.row - 1) * (this.cellSize + this.padding)
        })`;
      });

    const selectRect = updateStaes.selectAll('rect').data((d) => d.RootData);
    selectRect.exit().remove();
    const self = this;
    const updateRect = selectRect
      .enter()
      .append('rect')
      .merge(selectRect)
      .attr('x', (d) => d.x0)
      .attr('y', (d) => d.y0)
      .attr('width', (d) => d.x1 - d.x0)
      .attr('height', (d) => d.y1 - d.y0)
      .attr('fill', (d) => this.colorScale(d.data.name))
      .attr('stroke', '#fff')
      .attr('stroke-width', (d) => (d.x1 - d.x0 > 1 ? '0.5' : '0.1'));
    updateRect
      .on('mouseenter', function (d) {
        self.tooltip.transition().duration(200);
        const html = `<div style="color:#787878;font-size:12px; font-weight:bold;margin-bottom:1px;">${
          d.data.state + ' | ' + self.labelTootlTipConfig[d.data.name]
        }</div>
        <div style="color:#787878;margin-bottom:1px;"><b style="font-size:18px;">${
          Math.round(d.value) + '%'
        }</b><span style="color:#787878"> of Population</span></div>
       
        `;
        d3.select(this).style('stroke', (d) => {
          return 'rgb(0,0,0)';
        });
        self.tooltip
          .style('opacity', 1)
          .html(html)
          .style('top', d3.event.pageY - 28 + 'px');
        if (window.outerWidth <= d3.event.pageX + 230) {
          self.tooltip.style('left', d3.event.pageX - 230 + 'px');
        } else {
          self.tooltip.style('left', d3.event.pageX + 30 + 'px');
        }
      })
      .on('mousemove', function (d) {
        self.tooltip.style('top', d3.event.pageY - 28 + 'px');
        if (window.outerWidth <= d3.event.pageX + 230) {
          self.tooltip.style('left', d3.event.pageX - 230 + 'px');
        } else {
          self.tooltip.style('left', d3.event.pageX + 30 + 'px');
        }
      })
      .on('mouseleave', function (d) {
        d3.select(this).style('stroke', (d) => {
          return '#fff';
        });
        self.tooltip.style('opacity', 0);
      });

    const SelectAllLabels = updateStaes
      .selectAll('text.label')
      .data((d) => d.RootData);
    SelectAllLabels.exit().remove();
    // add state labels
    SelectAllLabels.enter()
      .append('text')
      .merge(SelectAllLabels)
      .attr('class', function (d) {
        return 'label ' + d.code;
      })
      .attr('x', function (d) {
        return d.x0 + 5;
      }) // +10 to adjust position (more right)
      .attr('y', function (d) {
        return d.y0 + 20;
      }) // +20 to adjust position (lower)
      .text(function (d, i) {
        if (i === 0) {
          return Math.round(d.data.value / 10) * 10 + '%';
        }
        return '';
      })
      .attr('font-size', '12px')
      .attr('fill', 'white');
  }
  resize() {
    this.width = d3.select('#' + this.id).node().clientWidth;
    this.height = d3.select('#' + this.id).node().clientHeight;
    this.svg.attr('width', this.width).attr('height', this.height);
    this.cellSize = this.calcCellSize(
      this.width - (this.margin.left + this.margin.right),
      this.height - (this.margin.bottom + this.margin.top),
      13,
      8
    );

    this.gridData = this.getGridData(13, 8, this.cellSize);
    this.ready();
    this.updateSize();
  }
  updateSize() {
    const svgGEleBox = this.svgG.node().getBBox();
    const newLeftSide = this.width / 2 - svgGEleBox.width / 2 - this.cellSize;
    this.svgG.attr(
      'transform',
      'translate(' + newLeftSide + ',' + this.margin.top + ')'
    );
  }

  // updateLegend() {
  //   const legendW = this.width / 2;
  //   const sybmoleSize = 200;
  //   const rightSide = this.legendG
  //     .append('g')
  //     .attr('transform', 'translate(' + (legendW + 200) / 2 + ',' + 0 + ')');
  //   const leftSide = this.legendG
  //     .append('g')
  //     .attr('transform', 'translate(' + legendW + ',' + 0 + ')');

  //   const textG = rightSide
  //     .selectAll('g.textL')
  //     .data(['Moved from', 'Moved to']);
  //   textG.exit().remove();
  //   const updateG = textG
  //     .enter()
  //     .append('g')
  //     .merge(textG)
  //     .attr('class', 'textL');

  //   const path = updateG.selectAll('path').data((d) => [d]);
  //   path.exit().remove();
  //   path
  //     .enter()
  //     .append('path')
  //     .merge(path)
  //     .attr('d', (d) => {
  //       if (d == 'Moved from') {
  //         return d3.symbol().type(d3.symbolSquare).size(sybmoleSize)();
  //       } else {
  //         return d3.symbol().type(d3.symbolCircle).size(sybmoleSize)();
  //       }
  //     })
  //     .attr('fill', (d, i) => {
  //       return d == 'Moved from'
  //         ? this.activeStateConfig.fill
  //         : 'rgb(37, 164, 99)';
  //     })
  //     .attr('stroke', (d) => {
  //       return d == 'Moved from'
  //         ? this.activeStateConfig.fill
  //         : 'rgb(37, 164, 99)';
  //     })
  //     .attr('transform', function (d, i) {
  //       return 'translate(' + (d == 'Moved from' ? 0 : 1) * 100 + ' ,0 )';
  //     });

  //   const text = updateG.selectAll('text').data((d) => [d]);
  //   text.exit().remove();
  //   text
  //     .enter()
  //     .append('text')
  //     .merge(text)
  //     .text((d) => d)
  //     .attr('fill', 'rgb(118, 118, 118)')
  //     .attr('alignment-baseline', 'central')
  //     .attr('text-anchor', 'middle')
  //     .attr('font-size', 14)
  //     .attr('pointer-events', 'none')
  //     .attr('transform', function (d, i) {
  //       return (
  //         'translate(' +
  //         ((d == 'Moved from' ? 0 : 1) * 100 + (d == 'Moved from' ? 50 : 40)) +
  //         ' ,0 )'
  //       );
  //     });

  //   const dat = [
  //     { value: 10 },
  //     { value: 10000 },
  //     { value: 30000 },
  //     { value: 70000 },
  //   ].map((d) => {
  //     const value = this.cricleScale(d.value);
  //     d.rediis = value;
  //     d.cy = this.legendHeight - value;
  //     d.cx = 100;
  //     d.text = d3.format(',.2r')(d.value) + ' moves';
  //     return d;
  //   });

  //   const circle = leftSide.selectAll('circle').data(dat);
  //   circle.exit().remove();
  //   circle
  //     .enter()
  //     .append('circle')
  //     .merge(circle)
  //     .attr('cx', (d) => d.cx)
  //     .attr('cy', (d) => d.cy)
  //     .attr('stroke-width', 1)
  //     .attr('stroke', 'rgb(0,0,0)')
  //     .attr('fill', 'rgb(37, 164, 99)')
  //     .attr('opacity', 0.3)
  //     .style('pointer-events', 'none')
  //     .attr('r', (d) => d.rediis);

  //   const line = leftSide.selectAll('line').data(dat);
  //   line.exit().remove();
  //   line
  //     .enter()
  //     .append('line')
  //     .merge(line)
  //     .attr('x1', (d) => d.cx)
  //     .attr('y1', (d) => d.cy - d.rediis)
  //     .attr('x2', (d) => d.cx + 100)
  //     .attr('y2', (d) => d.cy - d.rediis)
  //     .attr('stroke-width', 1)
  //     .attr('stroke', 'rgb(0,0,0)')
  //     .attr('fill', 'rgb(37, 164, 99)')
  //     .attr('opacity', 0.3)
  //     .style('pointer-events', 'none');

  //   const leftText = leftSide.selectAll('text').data(dat);
  //   leftText.exit().remove();
  //   leftText
  //     .enter()
  //     .append('text')
  //     .merge(leftText)
  //     .text((d) => d.text)
  //     .attr('x', (d) => d.cx + 100)
  //     .attr('y', (d) => d.cy - d.rediis)
  //     .attr('fill', 'rgb(118, 118, 118)')
  //     .attr('alignment-baseline', 'central')
  //     // .attr('text-anchor', 'middle')
  //     .attr('font-size', 14)
  //     .attr('pointer-events', 'none');

  //   this.legendG
  //     .append('text')
  //     .attr('x', (d) => this.width / 2)
  //     .attr('y', (d) => this.legendHeight + 20)
  //     .text('HOVER TO SEE MOVES')
  //     .attr('fill', 'rgb(118, 118, 118)')
  //     .attr('alignment-baseline', 'central')
  //     .attr('text-anchor', 'middle')
  //     .attr('font-size', 13)
  //     .attr('pointer-events', 'none');
  // }

  // function that generates a nested array for square grid
  getGridData(ncol, nrow, cellsize) {
    let gridData = [];
    let xpos = 1; // starting xpos and ypos at 1 so the stroke will show when we make the grid below
    let ypos = 1;

    // calculate width and height of the cell based on width and height of the canvas
    let cellSize = cellsize;

    // iterate for rows
    for (let row = 0; row < nrow; row++) {
      gridData.push([]);

      // iterate for cells/columns inside each row
      for (let col = 0; col < ncol; col++) {
        gridData[row].push({
          x: xpos,
          y: ypos,
          width: cellSize,
          height: cellSize,
        });

        // increment x position (moving over by 50)
        xpos += cellSize;
      }

      // reset x position after a row is complete
      xpos = 1;
      // increment y position (moving down by 50)
      ypos += cellSize;
    }
    return gridData;
  }

  //  to calculate grid cell size based on width and height of svg
  calcCellSize(w, h, ncol, nrow) {
    // leave tiny space in margins
    let gridWidth = w - 2;
    let gridHeight = h - 2;
    let cellSize;

    // calculate size of cells in columns across
    let colWidth = Math.floor(gridWidth / ncol);
    // calculate size of cells in rows down
    let rowWidth = Math.floor(gridHeight / nrow);

    // take the smaller of the calculated cell sizes
    if (colWidth <= rowWidth) {
      cellSize = colWidth;
    } else {
      cellSize = rowWidth;
    }
    return cellSize;
  }
}
