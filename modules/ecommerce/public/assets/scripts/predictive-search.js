/**
 * Predictive (typeahead) product search for the products filter
 * (the plain <ins-input> with id #filter-keyword).
 *
 * Strategy: expand the query into variations (buildSearchTerms), fire one
 * parallel request per variation against /api/products/predictive-search,
 * merge + dedupe by uuid, score client-side, sort, and render the top
 * matches in a custom dropdown. The pure scoring/normalisation helpers
 * make matching tolerant of word order, abbreviations, plurals and
 * synonyms; the dropdown UI, keyboard nav, load-more and state handling
 * are all handled here.
 */
(function (global) {
  "use strict";

  var ENDPOINT = "/api/products/predictive-search";
  var PAGE_SIZE = 50;
  var MIN_CHARS = 2;
  var DEBOUNCE_MS = 250;

  // Fallback thumbnail when a product has no image (matches cart-drawer.js).
  var PLACEHOLDER_IMAGE =
    '<div class="placeholder-img predictive-thumb vertical-align-middle">' +
    '<i class="icon-panorame"></i>' +
    "</div>";

  /* ----------------------------------------------------------------------
   * Search normalisation + scoring helpers
   * -------------------------------------------------------------------- */

  // Stop words ignored when tokenizing.
  var stopWords = new Set(["of", "the", "and", "for", "a", "an", "with"]);

  // Domain synonyms / abbreviations.
  // Admin-managed values are injected into the page as
  // window.PRODUCT_SEARCH_SYNONYMS (see main_filters.liquid); when absent
  // we fall back to these built-in defaults so search still degrades well.
  var defaultSynonymMap = {
    tee: ["t-shirt", "tshirt"],
    tshirt: ["t-shirt"],
    kids: ["children", "child"],
    xl: ["extra large"],
    xs: ["extra small"]
  };

  var synonymMap =
    global.PRODUCT_SEARCH_SYNONYMS &&
    typeof global.PRODUCT_SEARCH_SYNONYMS === "object" &&
    Object.keys(global.PRODUCT_SEARCH_SYNONYMS).length
      ? global.PRODUCT_SEARCH_SYNONYMS
      : defaultSynonymMap;

  // Normalize input for stable scoring (case/spacing/punctuation).
  var normalizeQuery = function (value) {
    return (value || "")
      .toLowerCase()
      // Treat ampersand as "and" for matching.
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  };

  // Tokenize while ignoring common stop words.
  var getTokens = function (value) {
    var normalized = normalizeQuery(value);
    if (!normalized) return [];
    return normalized.split(" ").filter(function (token) {
      return !stopWords.has(token);
    });
  };

  // Build a bidirectional synonym index from the injected { term: [syn,...] }
  // map. Every member of a group (the term plus its synonyms) maps to all the
  // others, so searching either "xl" or "extra large" finds the other. Keys
  // are normalized so multi-word terms ("extra large") and punctuation
  // ("t-shirt" -> "t shirt") look up reliably.
  var buildSynonymIndex = function (map) {
    var index = {};
    var link = function (key, values) {
      var k = normalizeQuery(key);
      if (!k) return;
      if (!index[k]) index[k] = {};
      values.forEach(function (value) {
        var v = normalizeQuery(value);
        if (v && v !== k) index[k][v] = true;
      });
    };
    Object.keys(map || {}).forEach(function (term) {
      var group = [term].concat(map[term] || []);
      group.forEach(function (member) {
        link(member, group);
      });
    });
    return index;
  };

  var synonymIndex = buildSynonymIndex(synonymMap);

  // Return the synonyms equivalent to a word or phrase (normalized lookup).
  var lookupSynonyms = function (phrase) {
    var key = normalizeQuery(phrase);
    return synonymIndex[key] ? Object.keys(synonymIndex[key]) : [];
  };

  // Add light plural/singular variants for token matching.
  var expandTokenVariants = function (token) {
    token = token || "";
    var variants = new Set([token]);
    if (token.endsWith("s") && token.length > 3) {
      variants.add(token.slice(0, -1));
    } else if (token.length > 2) {
      variants.add(token + "s");
    }
    return Array.from(variants);
  };

  // Build query variations for predictive matching.
  var buildSearchTerms = function (value) {
    var raw = (value || "").trim().toLowerCase();
    var normalized = normalizeQuery(value);
    var tokens = getTokens(value);
    var terms = new Set();

    // Keep raw query to support names with '&' (e.g. "AT&T").
    if (raw) terms.add(raw);
    if (normalized) terms.add(normalized);

    var withoutStops = tokens.join(" ");
    if (withoutStops) terms.add(withoutStops);

    // Whole-query synonyms (handles multi-word terms, e.g. "extra large" -> "xl").
    lookupSynonyms(value).forEach(function (syn) {
      terms.add(syn);
    });

    tokens.forEach(function (token) {
      if (token.length >= 2) terms.add(token);
      lookupSynonyms(token).forEach(function (syn) {
        terms.add(syn);
      });
      expandTokenVariants(token).forEach(function (variant) {
        terms.add(variant);
      });
    });

    return Array.from(terms);
  };

  // Checks if any word in the name starts with the query.
  var wordStartsWith = function (name, query) {
    return new RegExp("(^|\\s)" + query).test(name);
  };

  // Checks for exact word boundary matches in the name.
  var wordBoundaryMatch = function (name, query) {
    return new RegExp("\\b" + query + "\\b").test(name);
  };

  // Check if all query tokens appear in order in the name (ignoring stop words).
  var tokensInOrder = function (nameTokens, queryTokens) {
    if (queryTokens.length === 0) return false;
    var nameIndex = 0;
    for (var i = 0; i < queryTokens.length; i++) {
      var queryToken = queryTokens[i];
      var found = false;
      while (nameIndex < nameTokens.length) {
        if (
          nameTokens[nameIndex] === queryToken ||
          nameTokens[nameIndex].startsWith(queryToken) ||
          queryToken.startsWith(nameTokens[nameIndex])
        ) {
          found = true;
          nameIndex++;
          break;
        }
        nameIndex++;
      }
      if (!found) return false;
    }
    return true;
  };

  // Check if query tokens form a phrase in the name (allowing stop words between).
  var tokensFormPhrase = function (normalizedName, queryTokens) {
    if (queryTokens.length === 0) return false;
    var escapedTokens = queryTokens.map(function (token) {
      return token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    });
    var pattern = escapedTokens
      .map(function (token) {
        return "\\b" + token + "\\w*";
      })
      .join("\\s+\\w*\\s+");
    return new RegExp(pattern, "i").test(normalizedName);
  };

  // Check if all query tokens exactly match name tokens in order.
  var allTokensMatchInOrder = function (nameTokens, queryTokens) {
    if (queryTokens.length === 0 || nameTokens.length < queryTokens.length) {
      return false;
    }
    for (var i = 0; i <= nameTokens.length - queryTokens.length; i++) {
      var allMatch = true;
      for (var j = 0; j < queryTokens.length; j++) {
        if (
          nameTokens[i + j] !== queryTokens[j] &&
          !nameTokens[i + j].startsWith(queryTokens[j]) &&
          !queryTokens[j].startsWith(nameTokens[i + j])
        ) {
          allMatch = false;
          break;
        }
      }
      if (allMatch) return true;
    }
    return false;
  };

  // Check if normalized query (without stop words) matches normalized name.
  var normalizedQueryMatches = function (normalizedName, queryTokens) {
    var nameTokens = getTokens(normalizedName);
    var nameWithoutStops = nameTokens.join(" ");
    var queryWithoutStops = queryTokens.join(" ");

    if (nameWithoutStops === queryWithoutStops) {
      return { match: true, type: "exact" };
    }
    if (nameWithoutStops.startsWith(queryWithoutStops)) {
      return { match: true, type: "starts" };
    }
    if (nameWithoutStops.includes(queryWithoutStops)) {
      return { match: true, type: "contains" };
    }
    return { match: false, type: "none" };
  };

  // Higher score = closer match to the query.
  // Build query variations including synonym substitutions, so a product is
  // scored against the equivalent term the user means (e.g. typing
  // "extra large" is scored as if they had typed "xl"). Returns [{tokens, norm}].
  var buildQueryVariations = function (query) {
    var normalized = normalizeQuery(query);
    var variations = {};
    if (normalized) variations[normalized] = true;

    // Whole-phrase synonyms.
    lookupSynonyms(query).forEach(function (syn) {
      variations[syn] = true;
    });

    // Per-token synonyms, substituted back into the phrase.
    getTokens(query).forEach(function (token) {
      lookupSynonyms(token).forEach(function (syn) {
        variations[syn] = true;
        if (normalized) {
          variations[normalized.replace(new RegExp("\\b" + token + "\\b"), syn)] = true;
        }
      });
    });

    return Object.keys(variations).map(function (variation) {
      return { tokens: getTokens(variation), norm: variation };
    });
  };

  // Score a single query variation against a product name (higher = closer).
  var scoreAgainst = function (name, tokens, normalizedQueryStr) {
    var normalizedName = normalizeQuery(name);
    if (!normalizedName) return 0;
    var score = 0;

    var nameTokens = getTokens(name);

    var expandedTokens = tokens.reduce(function (acc, token) {
      acc.push(token);
      expandTokenVariants(token).forEach(function (variant) {
        acc.push(variant);
      });
      return acc;
    }, []);

    // 1. Exact normalized string match (highest priority).
    if (normalizedQueryStr && normalizedName === normalizedQueryStr) return 100;

    // 2. All query tokens exactly match name tokens in order.
    if (tokens.length > 0 && allTokensMatchInOrder(nameTokens, tokens)) {
      return 100;
    }

    // 3. Normalized query (without stop words) matches normalized name.
    if (tokens.length > 0) {
      var normalizedMatch = normalizedQueryMatches(normalizedName, tokens);
      if (normalizedMatch.match) {
        if (normalizedMatch.type === "exact") {
          score = 98;
        } else if (normalizedMatch.type === "starts") {
          score = 95;
        } else if (normalizedMatch.type === "contains") {
          score = 90;
        }
        if (tokensFormPhrase(normalizedName, tokens)) {
          score = Math.min(100, score + 2);
        }
      }
    }

    // 4. All query tokens appear in order in the name tokens.
    if (tokens.length > 0 && tokensInOrder(nameTokens, tokens) && score < 90) {
      score = 88;
      if (tokensFormPhrase(normalizedName, tokens)) {
        score = 92;
      }
    }

    // 5. Phrase matching (tokens form a phrase, allowing stop words).
    if (
      normalizedQueryStr &&
      tokens.length > 0 &&
      tokensFormPhrase(normalizedName, tokens) &&
      score < 85
    ) {
      score = 85;
    }

    // 6. Word boundary matching (query as exact phrase).
    if (
      normalizedQueryStr &&
      wordBoundaryMatch(normalizedName, normalizedQueryStr) &&
      score < 80
    ) {
      score = 80;
    }

    // 7. Query starts with word in name.
    if (
      normalizedQueryStr &&
      wordStartsWith(normalizedName, normalizedQueryStr) &&
      score < 70
    ) {
      score = 70;
    }

    // 8. Normalized name starts with normalized query.
    if (
      normalizedQueryStr &&
      normalizedName.startsWith(normalizedQueryStr) &&
      score < 60
    ) {
      score = 60;
    }

    // 9. Normalized name contains normalized query.
    if (
      normalizedQueryStr &&
      normalizedName.includes(normalizedQueryStr) &&
      score < 20
    ) {
      score = 20;
    }

    // 10. Token-based scoring (individual word matches) - only if still low.
    if (score < 50) {
      expandedTokens.forEach(function (token) {
        if (token.length < 2) return;
        var isVariant = tokens.indexOf(token) === -1;
        var boundaryScore = isVariant ? 6 : 15;
        var containsScore = isVariant ? 2 : 5;
        if (wordBoundaryMatch(normalizedName, token)) {
          score += boundaryScore;
        } else if (normalizedName.includes(token)) {
          score += containsScore;
        }
      });
    }

    return score;
  };

  // Score a product against every synonym-expanded variation of the query and
  // keep the best match.
  var scoreProduct = function (name, variations) {
    var best = 0;
    for (var i = 0; i < variations.length; i++) {
      var s = scoreAgainst(name, variations[i].tokens, variations[i].norm);
      if (s > best) best = s;
      if (best >= 100) break;
    }
    return best;
  };

  /* ----------------------------------------------------------------------
   * Fetching + ranking
   * -------------------------------------------------------------------- */

  // Fetch and merge results across query variations.
  var fetchPredictiveProducts = function (query, page, minScore, seen) {
    var searchTerms = buildSearchTerms(query);
    var variations = buildQueryVariations(query);
    if (!searchTerms.length) {
      return Promise.resolve({ results: [], hasNextPage: false });
    }

    var requests = searchTerms.map(function (term) {
      var url =
        ENDPOINT +
        "?keyword=" +
        encodeURIComponent(term) +
        "&page=" +
        page +
        "&size=" +
        PAGE_SIZE;
      return fetch(url, { headers: { Accept: "application/json" } })
        .then(function (response) {
          return response.ok ? response.json() : null;
        })
        .catch(function () {
          return null;
        });
    });

    return Promise.all(requests).then(function (responses) {
      var uniqueMap = new Map();
      var nextPageAvailable = false;

      responses.forEach(function (response) {
        var results = (response && response.items && response.items.results) || [];
        // If any variation filled a full page, assume more results exist.
        if (results.length >= PAGE_SIZE) nextPageAvailable = true;

        results.forEach(function (product) {
          var uuid = product && product.uuid;
          if (!uuid || uniqueMap.has(uuid) || (seen && seen.has(uuid))) return;
          var name = product.product_name || "";
          uniqueMap.set(uuid, {
            uuid: uuid,
            name: name,
            slug: product.slug,
            brand: product.brand,
            image: product.product_image && product.product_image.url,
            is_on_sale: product.is_on_sale,
            regular_price: product.regular_price,
            sale_price: product.sale_price,
            score: scoreProduct(name, variations)
          });
        });
      });

      var ranked = Array.from(uniqueMap.values())
        .filter(function (entry) {
          return entry.score >= minScore;
        })
        .sort(function (a, b) {
          return b.score - a.score || a.name.localeCompare(b.name);
        });

      return { results: ranked, hasNextPage: nextPageAvailable };
    });
  };

  // Lower score threshold for very short queries.
  var thresholdFor = function (normalized) {
    if (normalized.length <= 1) return 5;
    if (normalized.length <= 2) return 15;
    return 25;
  };

  /* ----------------------------------------------------------------------
   * Dropdown controller
   * -------------------------------------------------------------------- */

  var formatPrice = function (entry) {
    var price =
      entry.is_on_sale && entry.sale_price ? entry.sale_price : entry.regular_price;
    if (price === null || price === undefined || price === "") return "";
    var num = parseFloat(price);
    if (isNaN(num)) return "";
    return "$" + num.toFixed(2);
  };

  var PredictiveSearch = {
    inputEl: null,
    innerInput: null,
    wrap: null,
    dropdown: null,
    items: [],
    activeIndex: -1,
    query: "",
    page: 1,
    minScore: 25,
    seen: null,
    activeToken: 0,
    loading: false,
    hasNextPage: false,
    debounceTimer: null,

    init: function (inputEl) {
      if (!inputEl) return;
      this.inputEl = inputEl;
      this.seen = new Map();

      var self = this;
      // The <ins-input> hydrates asynchronously; wait for its inner DOM.
      var ready = function () {
        var innerInput = inputEl.getElementsByTagName("input")[0];
        var wrap = inputEl.querySelector(".input-wrap");
        if (!innerInput || !wrap) return false;
        self.innerInput = innerInput;
        self.wrap = wrap;
        self.buildDropdown();
        self.bindEvents();
        return true;
      };

      if (!ready()) {
        var observer = new MutationObserver(function () {
          if (ready()) observer.disconnect();
        });
        observer.observe(inputEl, { childList: true, subtree: true });
      }
    },

    buildDropdown: function () {
      var dropdown = document.createElement("ul");
      dropdown.className = "predictive-dropdown";
      dropdown.setAttribute("role", "listbox");
      dropdown.setAttribute("aria-label", "Product suggestions");
      this.wrap.appendChild(dropdown);
      this.dropdown = dropdown;
    },

    bindEvents: function () {
      var self = this;

      // Keyboard navigation (Enter is coordinated by product-list.js).
      this.innerInput.addEventListener("keydown", function (event) {
        if (!self.isOpen()) return;
        if (event.key === "ArrowDown") {
          event.preventDefault();
          self.move(1);
        } else if (event.key === "ArrowUp") {
          event.preventDefault();
          self.move(-1);
        } else if (event.key === "Escape") {
          self.close();
        }
      });

      // Load more when scrolled near the bottom of the list.
      this.dropdown.addEventListener("scroll", function () {
        var nearBottom =
          self.dropdown.scrollTop + self.dropdown.clientHeight >=
          self.dropdown.scrollHeight - 24;
        if (nearBottom && self.hasNextPage && !self.loading && self.query) {
          self.loadMore();
        }
      });

      // Close on outside click.
      document.addEventListener("click", function (event) {
        if (!self.inputEl.contains(event.target)) self.close();
      });
    },

    onInput: function (value) {
      var self = this;
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(function () {
        self.runSearch(value);
      }, DEBOUNCE_MS);
    },

    runSearch: function (value) {
      var self = this;
      var query = (value || "").trim();
      this.query = query;
      this.activeIndex = -1;

      if (query.length < MIN_CHARS) {
        this.close();
        return;
      }

      var token = ++this.activeToken;
      this.page = 1;
      this.seen.clear();
      this.minScore = thresholdFor(normalizeQuery(query));
      this.setLoading(true);

      fetchPredictiveProducts(query, this.page, this.minScore, this.seen).then(
        function (data) {
          if (token !== self.activeToken) return; // stale response, discard
          self.setLoading(false);
          self.hasNextPage = data.hasNextPage;
          self.items = data.results;
          data.results.forEach(function (entry) {
            self.seen.set(entry.uuid, true);
          });
          self.render(false);
        }
      );
    },

    loadMore: function () {
      var self = this;
      var token = this.activeToken;
      this.page += 1;
      this.setLoading(true);
      fetchPredictiveProducts(this.query, this.page, this.minScore, this.seen).then(
        function (data) {
          if (token !== self.activeToken) return;
          self.setLoading(false);
          self.hasNextPage = data.hasNextPage;
          data.results.forEach(function (entry) {
            self.seen.set(entry.uuid, true);
            self.items.push(entry);
          });
          self.render(true);
        }
      );
    },

    render: function (append) {
      var self = this;
      if (!append) this.dropdown.innerHTML = "";

      var startIndex = append ? this.dropdown.querySelectorAll(".predictive-option").length : 0;

      if (this.items.length === 0) {
        var empty = document.createElement("li");
        empty.className = "predictive-empty";
        empty.textContent = "No matches — press Enter to search";
        this.dropdown.appendChild(empty);
        this.open();
        return;
      }

      // Remove any previous empty-state node when appending.
      var emptyNode = this.dropdown.querySelector(".predictive-empty");
      if (emptyNode) emptyNode.remove();

      this.items.slice(startIndex).forEach(function (entry, offset) {
        var index = startIndex + offset;
        var li = document.createElement("li");
        li.className = "predictive-option";
        li.setAttribute("role", "option");
        li.setAttribute("data-index", index);
        li.setAttribute("data-slug", entry.slug || "");

        var html = "";
        if (entry.image) {
          html +=
            '<img class="predictive-thumb" src="' +
            encodeURI(entry.image) +
            '" alt="" loading="lazy" width="40" height="40">';
        } else {
          html += PLACEHOLDER_IMAGE;
        }
        html += '<span class="predictive-name">' + self.escapeHtml(entry.name) + "</span>";
        var price = formatPrice(entry);
        if (price) {
          html += '<span class="predictive-price">' + price + "</span>";
        }
        li.innerHTML = html;

        // mousedown beats the input blur so the click still registers.
        li.addEventListener("mousedown", function (event) {
          event.preventDefault();
          self.go(entry.slug);
        });
        li.addEventListener("mouseenter", function () {
          self.setActive(index);
        });

        self.dropdown.appendChild(li);
      });

      this.open();
    },

    move: function (delta) {
      var max = this.items.length - 1;
      if (max < 0) return;
      var next = this.activeIndex + delta;
      if (next < 0) next = 0;
      if (next > max) next = max;
      this.setActive(next);
      var node = this.dropdown.querySelector('[data-index="' + next + '"]');
      if (node && node.scrollIntoView) {
        node.scrollIntoView({ block: "nearest" });
      }
    },

    setActive: function (index) {
      this.activeIndex = index;
      var options = this.dropdown.querySelectorAll(".predictive-option");
      for (var i = 0; i < options.length; i++) {
        if (parseInt(options[i].getAttribute("data-index"), 10) === index) {
          options[i].classList.add("active");
          this.innerInput.setAttribute(
            "aria-activedescendant",
            "predictive-option-" + index
          );
        } else {
          options[i].classList.remove("active");
        }
      }
    },

    // Called by product-list.js to coordinate the Enter key.
    getActiveSlug: function () {
      if (!this.isOpen() || this.activeIndex < 0) return null;
      var entry = this.items[this.activeIndex];
      return entry ? entry.slug : null;
    },

    go: function (slug) {
      if (!slug) return;
      window.location.href = "/products/" + slug;
    },

    setLoading: function (state) {
      this.loading = state;
      if (this.inputEl.classList) {
        this.inputEl.classList.toggle("predictive-loading", state);
      }
    },

    isOpen: function () {
      return this.dropdown && this.dropdown.classList.contains("open");
    },

    open: function () {
      if (this.dropdown) {
        this.dropdown.classList.add("open");
        this.innerInput.setAttribute("aria-expanded", "true");
      }
    },

    close: function () {
      if (this.dropdown) {
        this.dropdown.classList.remove("open");
        this.dropdown.innerHTML = "";
        this.innerInput.setAttribute("aria-expanded", "false");
        this.innerInput.removeAttribute("aria-activedescendant");
      }
      this.activeIndex = -1;
    },

    escapeHtml: function (str) {
      return (str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }
  };

  global.PredictiveSearch = PredictiveSearch;
})(window);
