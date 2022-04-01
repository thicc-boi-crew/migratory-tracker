window.addEventListener("load", async () =>
{
    const DateTime = luxon.DateTime;

    let yearFilter = null;
    let companyFilter = null;

    const $sinceDiv = document.querySelector("#since");
    const $sinceTimer = document.querySelector("#since-timer");

    const $upcomingHeader = document.querySelector("#upcoming-header");
    const $upcomingDiv = document.querySelector("#upcoming");

    const $totalDiv = document.querySelector("#totals");

    const $filtersDiv = document.querySelector("#filters");
    const $filtersList = document.querySelector("#filters-list");

    const $historyDiv = document.querySelector("#history");

    const data = await (await fetch("data.json")).json();
    for (let i = 0, len = data.length; i < len; i++)
    {
        data[i].lastDay = DateTime.fromFormat(data[i].lastDay, "yyyy-LL-dd HH:mm");
    }

    // Company Colours + Company Filter
    const DEFAULT_COMPANY_COLOR = 'grey';
    const COMPANY_COLORS = {
        'goodlife': '#EF3025',
        'carfax': '#1294EF'
    };

    const companyNameSpan = (company) =>
    {
        const color = COMPANY_COLORS[company.toLowerCase()] || DEFAULT_COMPANY_COLOR;

        const $span = document.createElement("span");
        $span.classList.add("company-label");
        $span.style.color = color;
        $span.innerHTML = `${company}`;
        $span.onclick = () =>
        {
            companyFilter = company;
            updateFilters();
        };
        return $span;
    };

    // Year counts + year filter
    const years = data.reduce((set, rec) => set.add(rec.lastDay.year), new Set());
    for (const year of years)
    {
        const count = data.reduce((acc, record, index, array) => (acc += record.lastDay.year === year ? 1 : 0), 0);
        const $span = document.createElement("span");
        $span.classList.add("total");
        $span.innerHTML = `${year}: ${count}`;
        $span.onclick = () =>
        {
            document.querySelectorAll(".selected").forEach(s => s.classList.remove("selected"));
            if (yearFilter === Number(year))
            {
                yearFilter = null;
            }
            else
            {
                $span.classList.add("selected");
                yearFilter = Number(year);
            }
            updateFilters();
        };
        $totalDiv.appendChild($span);
    }

    const now = DateTime.now();

    // sort data by lastDay, then by name
    var sortedData = data
        .sort((recordA, recordB) =>
        {
            var result = 0;

            if (recordA.lastDay < recordB.lastDay)
                result = 1;
            else if (recordA.lastDay > recordB.lastDay)
                result = -1;
            else if (recordA.name > recordB.name)
                result = 1;
            else if (recordA.name < recordB.name)
                result = -1;

            return result;
        });

    // upcoming resignations
    const upcoming = sortedData
        .filter((record) =>
        {
            return record.lastDay > now;
        });

    // historic resignations
    const history = sortedData
        .filter((record) =>
        {
            return record.lastDay <= now;
        });

    // output upcoming resignations
    if (upcoming === null || upcoming.length === 0)
    {
        $upcomingHeader.style.display = "none";
        $sinceDiv.style.display = "block";
        $upcomingDiv.style.display = "none";

        const lastResignation = history[0];
        $sinceTimer.innerHTML = `The last resignation was about ${lastResignation.lastDay.toRelative()}. <small>(${lastResignation.lastDay.toFormat("yyyy-LL-dd")})</small>`;
    }
    else
    {
        $upcomingDiv.style.display = "block";
        $sinceDiv.style.display = "none";
        while ($upcomingDiv.firstChild)
        {
            $upcomingDiv.removeChild($upcomingDiv.firstChild);
        }

        for (const record of upcoming)
        {
            const $h4 = document.createElement("H4");
            $h4.innerHTML = `${record.lastDay.toRelative(true)} until ${record.name} leaves <comingFrom></comingFrom> for <goingTo></goingTo>. <small>(${record.lastDay.toFormat("yyyy-LL-dd")})</small>`;
            $h4.replaceChild(companyNameSpan(record.comingFrom), $h4.querySelector("comingFrom"));
            $h4.replaceChild(companyNameSpan(record.goingTo), $h4.querySelector("goingTo"));
            $upcomingDiv.appendChild($h4);
        }
    }

    let updateFilters = () =>
    {
        while ($filtersList.firstChild)
        {
            $filtersList.removeChild($filtersList.firstChild);
        }

        if (yearFilter || companyFilter)
        {
            $filtersDiv.classList.remove("hidden");
            if (yearFilter)
            {
                const $span = document.createElement("SPAN");
                $span.innerHTML = `Year: ${yearFilter}`;
                $span.classList.add("filter");
                $span.onclick = () =>
                {
                    yearFilter = null;
                    document.querySelectorAll(".selected").forEach(s => s.classList.remove("selected"));
                    updateFilters();
                };
                $filtersList.appendChild($span);
            }

            if (companyFilter)
            {
                const $span = document.createElement("SPAN");
                $span.innerHTML = `Company: ${companyFilter}`;
                $span.classList.add("filter");
                $span.onclick = () =>
                {
                    companyFilter = null;
                    updateFilters();
                };
                $filtersList.appendChild($span);
            }
        }
        else
        {
            $filtersDiv.classList.add("hidden");
        }
        renderHistoric();
    };

    let renderHistoric = () =>
    {
        // output historic resignations
        if (history !== null && history.length > 0)
        {
            $historyDiv.style.display = "block";
            while ($historyDiv.firstChild)
            {
                $historyDiv.removeChild($historyDiv.firstChild);
            }

            for (const record of history)
            {
                if ((yearFilter === null || yearFilter === record.lastDay.year)
                    && (companyFilter === null || companyFilter === record.comingFrom || companyFilter === record.goingTo))
                {
                    const $p = document.createElement("P");
                    $p.innerHTML = `${record.name} left <comingFrom></comingFrom> for <goingTo></goingTo> about ${record.lastDay.toRelative()}. <small>(${record.lastDay.toFormat("yyyy-LL-dd")})</small>`;
                    $p.replaceChild(companyNameSpan(record.comingFrom), $p.querySelector("comingFrom"));
                    $p.replaceChild(companyNameSpan(record.goingTo), $p.querySelector("goingTo"));
                    $historyDiv.appendChild($p);
                }
            }
        }
        else
        {
            $historyDiv.style.display = "none";
        }
    };

    updateFilters();
});